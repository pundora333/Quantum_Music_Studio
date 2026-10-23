"""Run the studio or reproduce a session without the browser."""
import argparse
import json
from pathlib import Path
from .config import defaults,validate,note_bank
from .model import acquire
from .export import export_data,save_figure
from .audio import export_audio


def main():
    parser=argparse.ArgumentParser(description='Local Quantum Music Studio (Python/Qiskit)')
    sub=parser.add_subparsers(dest='command',required=True)
    server=sub.add_parser('serve');server.add_argument('--port',type=int,default=8765)
    run=sub.add_parser('render');run.add_argument('--session',type=Path);run.add_argument('--out',type=Path,required=True)
    run.add_argument('--duration',type=float);run.add_argument('--samples',type=int);run.add_argument('--mp3',action='store_true')
    sub.add_parser('notes')
    args=parser.parse_args()
    try:
        if args.command=='serve':
            from .server import serve
            serve(args.port)
        elif args.command=='notes': print(json.dumps(note_bank(),ensure_ascii=False,indent=2))
        else:
            c=json.loads(args.session.read_text(encoding='utf-8')) if args.session else defaults()
            if args.duration is not None: c['duration']=args.duration
            c=validate(c);data=acquire(c,args.samples);export_data(data,c,args.out)
            for kind in ('fid','decay','spectrum'): save_figure(data,c,args.out/f'{kind}.png',kind)
            save_figure(data,c,args.out/'fid.jpeg');export_audio(data,c,args.out/'sound.wav')
            if args.mp3: export_audio(data,c,args.out/'sound.mp3')
            print(f'Exported session, complex FID, figures and audio to {args.out.resolve()}')
    except (ValueError,OSError) as error: parser.exit(1,f'Error: {error}\n')

if __name__=='__main__': main()
