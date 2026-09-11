'use client';
import { useRef, useState } from 'react';
import { compressImage, MAX_UPLOAD_BYTES } from '@/lib/image';
import type { Contributor } from '@/lib/types';

type UploadState = 'idle' | 'compressing' | 'uploading' | 'saving';

export function ContributeForm({
  cardId,
  token,
  onAdded,
}: {
  cardId: string;
  token: string;
  onAdded?: (c: Contributor) => void;
}) {
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null) {
    setError(null);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!f.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      setError('That image is too large (max 8 MB).');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function uploadPhoto(): Promise<{ photo_url: string; photo_key: string } | null> {
    if (!file) return null;
    setState('compressing');
    const compressed = await compressImage(file);

    setState('uploading');
    // 1) ask our server for a presigned R2 URL
    const presignRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cardId, token, contentType: compressed.type }),
    });
    const presign = await presignRes.json();
    if (!presignRes.ok) {
      // R2 not configured yet, or rejected — allow submitting text-only.
      throw new Error(presign.error || 'Photo upload is unavailable right now.');
    }

    // 2) upload the bytes DIRECTLY to R2 (never through our server / DB)
    const put = await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': compressed.type },
      body: compressed,
    });
    if (!put.ok) throw new Error('Upload to storage failed. Please try again.');

    return { photo_url: presign.publicUrl, photo_key: presign.key };
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !message.trim()) {
      setError('Please add your name and a message.');
      return;
    }
    try {
      let photo: { photo_url: string; photo_key: string } | null = null;
      if (file) {
        photo = await uploadPhoto();
      }

      setState('saving');
      const res = await fetch(`/api/contribute/${cardId}/${token}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
          photo_url: photo?.photo_url ?? null,
          photo_key: photo?.photo_key ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save your message.');

      onAdded?.(data.contributor);
      setDone(true);
      setName('');
      setMessage('');
      pickFile(null);
      if (fileInput.current) fileInput.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setState('idle');
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl bg-white/90 p-6 text-center tile-shadow">
        <div className="mb-2 text-4xl">🎉</div>
        <p className="font-medium text-stone-800">Thank you! Your message was added.</p>
        <button
          onClick={() => setDone(false)}
          className="mt-4 rounded-full bg-stone-800 px-5 py-2 text-sm font-medium text-white hover:bg-stone-700"
        >
          Add another
        </button>
      </div>
    );
  }

  const working = state !== 'idle';
  const label =
    state === 'compressing'
      ? 'Optimizing photo…'
      : state === 'uploading'
        ? 'Uploading photo…'
        : state === 'saving'
          ? 'Saving…'
          : 'Add my message';

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/90 p-6 tile-shadow">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Alex"
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">Your message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={1000}
            rows={4}
            placeholder="Write something heartfelt…"
            className="w-full resize-y rounded-lg border border-stone-300 px-3 py-2"
          />
          <div className="mt-1 text-right text-xs text-stone-400">{message.length}/1000</div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-stone-700">
            Photo <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-stone-700"
          />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="mt-3 max-h-56 rounded-xl object-cover" />
          )}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={working}
          className="w-full rounded-full bg-rose-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-rose-500 disabled:opacity-60"
        >
          {label}
        </button>
      </div>
    </form>
  );
}
