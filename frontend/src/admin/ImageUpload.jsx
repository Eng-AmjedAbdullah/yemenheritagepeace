import { useEffect, useMemo, useRef, useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import {
  Check,
  Copy,
  ExternalLink,
  ImagePlus,
  Loader2,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-react'
import { useAdminLang } from './adminI18n'
import { resolveMediaUrl } from '../lib/media'

function isManagedUpload(value) {
  if (!value) return false

  const v = String(value).trim()

  if (!v) return false

  return (
    v.startsWith('/uploads/') ||
    v.includes('/storage/v1/object/public/') ||
    v.includes('/storage/v1/object/sign/')
  )
}

export default function ImageUpload({
  value,
  onChange,
  onUploadComplete,
  folder = 'general',
  label,
  previewHeight = 'h-64 sm:h-72',
  compact = false,
}) {
  const { isRtl } = useAdminLang()
  const fileRef = useRef(null)
  const menuRef = useRef(null)

  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const rawValue = (value || '').trim()
  const hasValue = Boolean(rawValue)
  const previewSrc = useMemo(() => resolveMediaUrl(rawValue), [rawValue])
  const isExternal = /^https?:/i.test(rawValue)
  const canDeleteFromStorage = isManagedUpload(rawValue)

  const text = {
    label: label || (isRtl ? 'صورة' : 'Image'),
    saved: isExternal
      ? (isRtl ? 'رابط خارجي' : 'External URL')
      : (isRtl ? 'صورة محفوظة' : 'Saved image'),
    loading: isRtl ? 'جارٍ رفع الصورة...' : 'Uploading image...',
    removing: isRtl ? 'جارٍ حذف الصورة...' : 'Removing image...',
    noImageTitle: isRtl ? 'لا توجد صورة حالياً' : 'No image yet',
    noImageText: isRtl
      ? 'يمكنك رفع صورة من الجهاز أو إدخال رابط مباشر للصورة.'
      : 'You can upload an image from your device or enter a direct image URL.',
    brokenTitle: isRtl ? 'تعذر عرض الصورة الحالية' : 'Could not preview current image',
    brokenText: isRtl
      ? 'تأكد من أن الرابط صحيح وأن الصورة متاحة، أو ارفع صورة جديدة.'
      : 'Make sure the image URL is valid and accessible, or upload a new image.',
    upload: isRtl ? 'رفع صورة' : 'Upload image',
    replace: isRtl ? 'استبدال الصورة' : 'Replace image',
    open: isRtl ? 'فتح الصورة' : 'Open image',
    copy: isRtl ? 'نسخ الرابط' : 'Copy link',
    copied: isRtl ? 'تم نسخ الرابط' : 'Link copied',
    remove: isRtl ? 'حذف الصورة' : 'Remove image',
    edit: isRtl ? 'تعديل الصورة' : 'Edit image',
    urlLabel: isRtl ? 'رابط الصورة أو المسار المحفوظ' : 'Image URL or saved path',
    urlPlaceholder: isRtl
      ? 'https://example.com/image.jpg أو رابط Supabase public URL'
      : 'https://example.com/image.jpg or a Supabase public URL',
    help: isRtl
      ? 'الصيغ المدعومة: PNG, JPG, JPEG, WebP — الحد الأقصى 10MB عند الرفع من الجهاز.'
      : 'Supported formats: PNG, JPG, JPEG, WebP — max 10MB when uploading from device.',
    imagesOnly: isRtl ? 'يُسمح بالصور فقط' : 'Images only',
    maxSize: isRtl ? 'الحجم الأقصى 10MB' : 'Maximum size is 10MB',
    uploadSuccess: isRtl ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully',
    uploadFail: isRtl ? 'فشل رفع الصورة: ' : 'Upload failed: ',
    copyFail: isRtl ? 'تعذر نسخ الرابط' : 'Could not copy link',
    removeSuccess: isRtl ? 'تم حذف الصورة' : 'Image removed',
    removeFail: isRtl ? 'فشل حذف الصورة: ' : 'Remove failed: ',
  }

  useEffect(() => {
    setImageError(false)
  }, [rawValue])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }

    const handleEsc = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(text.imagesOnly)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(text.maxSize)
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    setUploading(true)
    setMenuOpen(false)

    try {
      const data = await api.upload(file, folder)
      onChange(data.url || '')
      onUploadComplete?.({
        url: data.url || '',
        thumbnail_url: data.thumbnail_url || '',
        path: data.path || '',
        thumbnail_path: data.thumbnail_path || '',
        optimized: Boolean(data.optimized),
        original_size: data.original_size || 0,
        size: data.size || 0,
        thumbnail_size: data.thumbnail_size || 0,
      })
      setImageError(false)
      toast.success(text.uploadSuccess)
    } catch (err) {
      toast.error(text.uploadFail + (err?.message || 'Unknown error'))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const openPicker = () => {
    if (uploading || removing) return
    setMenuOpen(false)
    fileRef.current?.click()
  }

  const handleCopy = async () => {
    if (!rawValue) return

    try {
      await navigator.clipboard.writeText(rawValue)
      setCopied(true)
      setMenuOpen(false)
      toast.success(text.copied)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error(text.copyFail)
    }
  }

  const handleOpen = () => {
    if (!previewSrc) return
    setMenuOpen(false)
    window.open(previewSrc, '_blank', 'noopener,noreferrer')
  }

  const handleRemove = async () => {
    if (!rawValue || removing) return

    setRemoving(true)
    setMenuOpen(false)

    try {
      if (canDeleteFromStorage) {
        await api.deleteUploadedFile(rawValue)
      }

      onChange('')
      setImageError(false)
      toast.success(text.removeSuccess)
    } catch (err) {
      toast.error(text.removeFail + (err?.message || 'Unknown error'))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className={`flex items-center justify-between gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <label className="block text-sm font-medium text-gray-700">
          {text.label}
        </label>

        {hasValue && (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
            {text.saved}
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="relative bg-white">
          <div className={`relative flex ${previewHeight} items-center justify-center overflow-hidden bg-gray-50 p-4`}>
            {uploading || removing ? (
              <div className="px-6 text-center text-primary">
                <Loader2 size={30} className="mx-auto mb-3 animate-spin" />
                <p className="text-sm font-medium">
                  {uploading ? text.loading : text.removing}
                </p>
              </div>
            ) : hasValue && !imageError ? (
              <img
                src={previewSrc}
                alt={text.label}
                className="h-full max-h-full w-full rounded-xl object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="px-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ImagePlus size={24} />
                </div>

                <p className="mb-1 text-sm font-semibold text-gray-700 sm:text-base">
                  {hasValue ? text.brokenTitle : text.noImageTitle}
                </p>

                <p className="mx-auto max-w-md text-sm leading-6 text-gray-400">
                  {hasValue ? text.brokenText : text.noImageText}
                </p>
              </div>
            )}

            <div
              className={`absolute bottom-3 ${isRtl ? 'left-3' : 'right-3'}`}
              ref={menuRef}
            >
              <button
                type="button"
                onClick={() => !uploading && !removing && setMenuOpen((prev) => !prev)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:scale-105 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                title={text.edit}
                disabled={uploading || removing}
              >
                <Pencil size={16} />
              </button>

              {menuOpen && (
                <div
                  className={`absolute bottom-14 z-20 min-w-[210px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl ${
                    isRtl ? 'left-0 text-right' : 'right-0 text-left'
                  }`}
                >
                  <button
                    type="button"
                    onClick={openPicker}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-primary/5 ${
                      isRtl ? 'flex-row-reverse justify-end' : ''
                    }`}
                  >
                    {hasValue ? <Upload size={16} /> : <ImagePlus size={16} />}
                    <span>{hasValue ? text.replace : text.upload}</span>
                  </button>

                  {hasValue && (
                    <>
                      <button
                        type="button"
                        onClick={handleOpen}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-primary/5 ${
                          isRtl ? 'flex-row-reverse justify-end' : ''
                        }`}
                      >
                        <ExternalLink size={16} />
                        <span>{text.open}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition hover:bg-primary/5 ${
                          isRtl ? 'flex-row-reverse justify-end' : ''
                        }`}
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        <span>{text.copy}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRemove}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50 ${
                          isRtl ? 'flex-row-reverse justify-end' : ''
                        }`}
                      >
                        <Trash2 size={16} />
                        <span>{text.remove}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`border-t border-gray-200 bg-white ${compact ? 'p-3' : 'p-4'}`}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
            <label className={`block text-xs font-medium text-gray-500 ${isRtl ? 'text-right' : 'text-left'}`}>
              {text.urlLabel}
            </label>

            <input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="input-field text-sm"
              dir="ltr"
              placeholder={text.urlPlaceholder}
            />

            <p className={`text-xs leading-5 text-gray-400 ${isRtl ? 'text-right' : 'text-left'}`}>
              {text.help}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}