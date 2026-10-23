using System;
using UnityEngine;

// Import exported FID JSON as a TextAsset; attach this component and an AudioSource.
// This dry mapping corresponds to Studio's FID carriers, not its creative FX.
[RequireComponent(typeof(AudioSource))]
public sealed class FIDSonifier : MonoBehaviour
{
    [Serializable] public sealed class FIDData
    {
        public string format;
        public string observed;
        public float physicalWindowMs;
        public float audioDurationSeconds;
        public float levelDb;
        public float audioGainScale;
        public string stereo;
        public float[] carrierHz;
        public float[] q0Re, q0Im, q1Re, q1Im;
    }
    public TextAsset exportedFID;
    public int sampleRate = 44100;
    public bool playOnStart;
    private AudioClip generatedClip;

    private void Start() { if (playOnStart) BuildAndPlay(); }

    [ContextMenu("Build and play exported FID")]
    public void BuildAndPlay()
    {
        if (exportedFID == null) throw new InvalidOperationException("Assign exported FID JSON.");
        FIDData d = JsonUtility.FromJson<FIDData>(exportedFID.text);
        if (d == null || (d.format != "pundora-fid-v2" && d.format != "pundora-fid-v3") || d.carrierHz == null || d.carrierHz.Length != 2)
            throw new InvalidOperationException("Unsupported FID JSON.");
        if (d.q0Re == null || d.q0Im == null || d.q1Re == null || d.q1Im == null)
            throw new InvalidOperationException("Missing complex quadratures.");
        int n = d.q0Re.Length;
        if (n < 2 || d.q0Im.Length != n || d.q1Re.Length != n || d.q1Im.Length != n ||
            d.audioDurationSeconds <= 0 || sampleRate <= 0)
            throw new InvalidOperationException("Invalid quadrature lengths or duration.");
        double count = Math.Round((double)d.audioDurationSeconds * sampleRate);
        if (count < 1 || count > int.MaxValue / 2) throw new InvalidOperationException("Audio buffer too large.");
        int frames = (int)count;
        float[] pcm = new float[frames * 2];
        double gain = (d.audioGainScale > 0 ? d.audioGainScale : 0.25) * Math.Pow(10, d.levelDb / 20.0);
        for (int k = 0; k < frames; k++)
        {
            double t = (double)k / sampleRate;
            // Uniform FID samples span the entire physical acquisition window.
            double index = frames == 1 ? 0 : (double)k / (frames - 1) * (n - 1);
            int a = Math.Min(n - 2, (int)Math.Floor(index));
            double u = index - a;
            double taper = Math.Min(1, k / (sampleRate * 0.005)) *
                           Math.Min(1, (frames - 1 - k) / (sampleRate * 0.020));
            for (int q = 0; q < 2; q++)
            {
                if (d.observed != "both" && d.observed != "q" + q) continue;
                float[] re = q == 0 ? d.q0Re : d.q1Re;
                float[] im = q == 0 ? d.q0Im : d.q1Im;
                double mx = re[a] * (1 - u) + re[a + 1] * u;
                double my = im[a] * (1 - u) + im[a + 1] * u;
                double phase = 2 * Math.PI * d.carrierHz[q] * t;
                pcm[2 * k + q] = (float)Math.Max(-0.99, Math.Min(0.99,
                    (mx * Math.Cos(phase) - my * Math.Sin(phase)) * gain * taper));
            }
            if (d.stereo == "center")
            {
                float mono = (pcm[2 * k] + pcm[2 * k + 1]) / (d.observed == "both" ? 2 : 1);
                pcm[2 * k] = pcm[2 * k + 1] = mono;
            }
        }
        AudioSource source = GetComponent<AudioSource>();
        source.Stop();
        if (generatedClip != null) Destroy(generatedClip);
        generatedClip = AudioClip.Create("Synthetic NMR FID", frames, 2, sampleRate, false);
        generatedClip.SetData(pcm, 0);
        source.clip = generatedClip;
        source.loop = false;
        source.Play();
    }
    private void OnDestroy() { if (generatedClip != null) Destroy(generatedClip); }
}
