import json,subprocess,threading,wave,shutil
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import numpy as np
import pytest
from PIL import Image
from quantum_studio.model import acquire
from quantum_studio.config import defaults
from quantum_studio.audio import render_chunks,export_audio
from quantum_studio.export import export_data,save_figure
from quantum_studio.server import LocalServer
from test_physics import reference,ROOT


@pytest.mark.parametrize('sound',['fid','transitions','population','excitation'])
@pytest.mark.parametrize('fx',[0,.6])
def test_audio_matches_browser_renderer(sound,fx):
    c=defaults();c.update(duration=.2,sound=sound,fx=fx,stereo='center')
    data=acquire(c,128);py=np.concatenate(list(render_chunks(data,c,137)))[:5000]
    js=reference(action='audio',configuration=c,options=dict(samples=128,maxStep=.000025),frames=5000)
    np.testing.assert_allclose(py,np.asarray(js).T,atol=3e-6,rtol=2e-5)
    assert np.max(abs(py))>.01
    np.testing.assert_array_equal(py[:,0],py[:,1])


def test_wav_mp3_data_and_figures(tmp_path):
    c=defaults();c.update(duration=.37,stereo='center');data=acquire(c,128)
    wav=export_audio(data,c,tmp_path/'test.wav');mp3=export_audio(data,c,tmp_path/'test.mp3')
    with wave.open(str(wav)) as reader:
        assert reader.getnframes()==round(.37*44100);assert reader.getnchannels()==2;assert reader.getsampwidth()==2;assert reader.getframerate()==44100
        a=np.frombuffer(reader.readframes(reader.getnframes()),'<i2').reshape(-1,2)/32767
        assert np.max(abs(a))>.1;assert np.sqrt(np.mean(a*a))>.01
    assert mp3.stat().st_size>1000
    if shutil.which('ffmpeg'):
        decoded=subprocess.run(['ffmpeg','-v','error','-i',str(mp3),'-f','f32le','-'],capture_output=True,check=True).stdout
        a=np.frombuffer(decoded,'<f4');assert np.max(abs(a))>.08;assert np.sqrt(np.mean(a*a))>.005
    export_data(data,c,tmp_path);assert len(json.loads((tmp_path/'fid.json').read_text())['timeMs'])==128
    assert np.loadtxt(tmp_path/'fid.csv',delimiter=',',skiprows=1).shape==(128,5)
    for kind in ('fid','decay','spectrum'):
        path=save_figure(data,c,tmp_path/f'{kind}.png',kind)
        with Image.open(path) as im: assert im.size==(1620,684)
    save_figure(data,c,tmp_path/'fid.jpeg')


def test_single_channel_and_chunk_independence():
    c=defaults();c.update(duration=.05,observed='q0',fx=.7)
    d=acquire(c,128);a=np.concatenate(list(render_chunks(d,c,137)));b=np.concatenate(list(render_chunks(d,c,8192)))
    np.testing.assert_array_equal(a,b);assert np.max(abs(a[:,1]))==0
    c['stereo']='center';a=np.concatenate(list(render_chunks(d,c)));np.testing.assert_array_equal(a[:,0],a[:,1])


@pytest.fixture
def server():
    instance=LocalServer(0);thread=threading.Thread(target=instance.serve_forever,daemon=True);thread.start()
    yield instance,f'http://127.0.0.1:{instance.server_address[1]}'
    instance.shutdown();instance.server_close();thread.join(timeout=2)


def test_server_local_only_schema_and_assets(server):
    instance,url=server
    assert json.load(urlopen(url+'/api/health'))['status']=='ok'
    for resource in ('/','/app.js','/studio.js','/studio-model.js','/studio-model-original.js','/python-bridge.js','/style.css'):
        assert urlopen(url+resource).status==200
    payload=json.dumps(dict(configuration=defaults(),options=dict(samples=32))).encode()
    result=json.load(urlopen(Request(url+'/api/acquire',data=payload,headers={'Content-Type':'application/json'})))
    assert result['samples']==32;assert len(result['signal'][0])==64
    with pytest.raises(HTTPError) as error: urlopen(Request(url+'/api/acquire',data=b'{}',headers={'Content-Type':'application/json'}))
    assert error.value.code==400
    for headers in ({'Origin':'https://example.com'},{'Host':'evil.example'}):
        with pytest.raises(HTTPError) as error: urlopen(Request(url+'/api/health',headers=headers))
        assert error.value.code==403
    with pytest.raises(HTTPError) as error: urlopen(url+'/%2e%2e/%2e%2e/README.md')
    assert error.value.code==404


def test_python_frontend_dom_integration(server):
    if not shutil.which('node') or not (ROOT/'web/node_modules/jsdom').exists(): pytest.skip('Run npm ci in web/ for the DOM integration test.')
    result=subprocess.run(['node',str(ROOT/'research/python-dom.mjs'),server[1]],text=True,capture_output=True,timeout=40)
    assert result.returncode==0,result.stdout+result.stderr
    assert 'Python DOM integration passed' in result.stdout
