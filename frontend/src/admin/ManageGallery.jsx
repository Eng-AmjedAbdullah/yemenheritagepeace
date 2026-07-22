import { useContext, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Edit,
  Film,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  Video,
} from 'lucide-react'

import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import ImageUpload from './ImageUpload'
import AdminModal from './AdminModal'
import ValidatedField from './ValidatedField'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

const MAX_IMAGES = 50
const MAX_VIDEO_FILES = 10
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 250 * 1024 * 1024

const EMPTY_COLLECTION = {
  title: '',
  title_en: '',
  type: 'photo',
  cover_url: '',
  sort_order: 0,
  is_active: true,
}

const EMPTY_TOUCHED = {
  title: false,
  title_en: false,
  cover_url: false,
  sort_order: false,
  media: false,
  video_urls: false,
}

const toastTheme = {
  success: {
    duration: 3000,
    style: {
      background: '#166534',
      color: '#ffffff',
      border: '1px solid #15803d',
      borderRadius: '12px',
      fontSize: '14px',
      padding: '14px 18px',
    },
  },
  error: {
    duration: 4500,
    style: {
      background: '#7f1d1d',
      color: '#ffffff',
      border: '1px solid #991b1b',
      borderRadius: '12px',
      fontSize: '14px',
      padding: '14px 18px',
    },
  },
}

function isActive(value) {
  return value === true || value === 1 || value === '1'
}

function toNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB'
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isValidHttpUrl(value) {
  if (!value) return true

  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function validateForm(form, options) {
  const { isRtl, editCollectionId, photoFiles, videoFiles, videoUrls } = options
  const errors = {}

  if (!form.title.trim()) {
    errors.title = isRtl ? 'عنوان المجموعة مطلوب' : 'Collection title is required'
  } else if (form.title.trim().length > 180) {
    errors.title = isRtl
      ? 'العنوان طويل جدًا، الحد الأقصى 180 حرفًا'
      : 'Title is too long. Maximum is 180 characters'
  }

  if (form.title_en.trim().length > 180) {
    errors.title_en = isRtl
      ? 'العنوان الإنجليزي طويل جدًا'
      : 'English title is too long'
  }

  if (form.cover_url && !isValidHttpUrl(form.cover_url)) {
    errors.cover_url = isRtl ? 'رابط الغلاف غير صحيح' : 'Cover URL is invalid'
  }

  if (toNumber(form.sort_order) < 0) {
    errors.sort_order = isRtl
      ? 'الترتيب لا يمكن أن يكون سالبًا'
      : 'Order cannot be negative'
  }

  if (!editCollectionId && form.type === 'photo' && photoFiles.length === 0) {
    errors.media = isRtl
      ? 'اختر صورة واحدة على الأقل'
      : 'Choose at least one image'
  }

  const cleanVideoUrls = videoUrls.map((url) => url.trim()).filter(Boolean)

  if (
    !editCollectionId &&
    form.type === 'video' &&
    cleanVideoUrls.length === 0 &&
    videoFiles.length === 0
  ) {
    errors.media = isRtl
      ? 'أضف رابط فيديو أو ارفع ملف فيديو واحدًا على الأقل'
      : 'Add a video URL or upload at least one video file'
  }

  if (cleanVideoUrls.some((url) => !isValidHttpUrl(url))) {
    errors.video_urls = isRtl
      ? 'يوجد رابط فيديو غير صحيح'
      : 'One or more video URLs are invalid'
  }

  return errors
}

export default function ManageGallery() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_COLLECTION)
  const [touched, setTouched] = useState(EMPTY_TOUCHED)
  const [editCollectionId, setEditCollectionId] = useState(null)
  const [collectionItems, setCollectionItems] = useState([])

  const [photoFiles, setPhotoFiles] = useState([])
  const [videoFiles, setVideoFiles] = useState([])
  const [videoUrls, setVideoUrls] = useState([''])

  const pageTitle = isRtl ? 'إدارة المعرض' : 'Manage Gallery'

  const load = async () => {
    setLoading(true)

    try {
      const data = await api.get('/gallery/collections/all', {
        loadingLabel: 'admin-gallery-collections',
      })
      setCollections(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to load gallery collections:', error)
      setCollections([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const errors = useMemo(
    () =>
      validateForm(form, {
        isRtl,
        editCollectionId,
        photoFiles,
        videoFiles,
        videoUrls,
      }),
    [
      form,
      isRtl,
      editCollectionId,
      photoFiles,
      videoFiles,
      videoUrls,
    ]
  )

  const filteredCollections = useMemo(() => {
    if (filter === 'all') return collections
    return collections.filter((collection) => collection.type === filter)
  }, [collections, filter])

  const photosCount = collections.filter(
    (collection) => collection.type === 'photo'
  ).length
  const videosCount = collections.filter(
    (collection) => collection.type === 'video'
  ).length

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }))
  }

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
    setTouched((current) => ({ ...current, [key]: true }))
  }

  const resetModalState = () => {
    setForm(EMPTY_COLLECTION)
    setTouched(EMPTY_TOUCHED)
    setEditCollectionId(null)
    setCollectionItems([])
    setPhotoFiles([])
    setVideoFiles([])
    setVideoUrls([''])
  }

  const openAddCollection = (type) => {
    resetModalState()
    setForm({ ...EMPTY_COLLECTION, type })
    setModalOpen(true)
  }

  const openEditCollection = async (collection) => {
    resetModalState()
    setEditCollectionId(collection.id)
    setForm({
      title: collection.title || '',
      title_en: collection.title_en || '',
      type: collection.type || 'photo',
      cover_url: collection.cover_url || '',
      sort_order: collection.sort_order || 0,
      is_active: isActive(collection.is_active),
    })
    setModalOpen(true)

    try {
      const detail = await api.get(`/gallery/collections/${collection.id}`, {
        loadingLabel: 'admin-gallery-collection-detail',
      })
      setCollectionItems(Array.isArray(detail?.items) ? detail.items : [])
    } catch (error) {
      console.error('Failed to load collection items:', error)
      setCollectionItems([])
    }
  }

  const closeModal = () => {
    setModalOpen(false)
    resetModalState()
  }

  const handlePhotoFiles = (event) => {
    const files = Array.from(event.target.files || [])
    const invalid = files.find(
      (file) => !file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE
    )

    if (files.length > MAX_IMAGES) {
      toast.error(
        isRtl
          ? `الحد الأقصى ${MAX_IMAGES} صورة في المرة الواحدة`
          : `Maximum ${MAX_IMAGES} images at once`,
        toastTheme.error
      )
      event.target.value = ''
      return
    }

    if (invalid) {
      toast.error(
        isRtl
          ? 'تأكد أن الملفات صور وحجم كل صورة لا يتجاوز 10MB'
          : 'Use image files no larger than 10MB each',
        toastTheme.error
      )
      event.target.value = ''
      return
    }

    setPhotoFiles(files)
    markTouched('media')
  }

  const handleVideoFiles = (event) => {
    const files = Array.from(event.target.files || [])
    const invalid = files.find(
      (file) => !file.type.startsWith('video/') || file.size > MAX_VIDEO_SIZE
    )

    if (files.length > MAX_VIDEO_FILES) {
      toast.error(
        isRtl
          ? `الحد الأقصى ${MAX_VIDEO_FILES} ملفات فيديو في المرة الواحدة`
          : `Maximum ${MAX_VIDEO_FILES} video files at once`,
        toastTheme.error
      )
      event.target.value = ''
      return
    }

    if (invalid) {
      toast.error(
        isRtl
          ? 'تأكد أن الملفات فيديو وحجم كل فيديو لا يتجاوز 250MB'
          : 'Use video files no larger than 250MB each',
        toastTheme.error
      )
      event.target.value = ''
      return
    }

    setVideoFiles(files)
    markTouched('media')
  }

  const addVideoUrl = () => {
    setVideoUrls((current) => [...current, ''])
  }

  const updateVideoUrl = (index, value) => {
    setVideoUrls((current) =>
      current.map((url, currentIndex) =>
        currentIndex === index ? value : url
      )
    )
    markTouched('video_urls')
    markTouched('media')
  }

  const removeVideoUrl = (index) => {
    setVideoUrls((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index)
      return next.length ? next : ['']
    })
    markTouched('video_urls')
  }

  const buildCollectionPayload = () => ({
    title: form.title.trim(),
    title_en: form.title_en.trim(),
    type: form.type,
    cover_url: form.cover_url || '',
    sort_order: toNumber(form.sort_order),
    is_active: Boolean(form.is_active),
  })

  const uploadNewItems = async (collectionPayload) => {
    if (collectionPayload.type === 'photo') {
      if (!photoFiles.length) return []

      const uploaded = await api.uploadMany(photoFiles, 'gallery/photos')

      return (uploaded.files || []).map((file, index) => ({
        title: collectionPayload.title,
        title_en: collectionPayload.title_en,
        image_url: file.url,
        thumbnail_url: file.url,
        video_url: '',
        sort_order: collectionItems.length + index + 1,
        is_active: true,
      }))
    }

    const directItems = videoUrls
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url, index) => ({
        title: collectionPayload.title,
        title_en: collectionPayload.title_en,
        image_url: '',
        thumbnail_url: collectionPayload.cover_url || '',
        video_url: url,
        sort_order: collectionItems.length + index + 1,
        is_active: true,
      }))

    let uploadedItems = []

    if (videoFiles.length) {
      const uploaded = await api.uploadManyMedia(
        videoFiles,
        'gallery/videos'
      )

      uploadedItems = (uploaded.files || []).map((file, index) => ({
        title: collectionPayload.title,
        title_en: collectionPayload.title_en,
        image_url: '',
        thumbnail_url: collectionPayload.cover_url || '',
        video_url: file.url,
        sort_order:
          collectionItems.length + directItems.length + index + 1,
        is_active: true,
      }))
    }

    return [...directItems, ...uploadedItems]
  }

  const handleSave = async () => {
    setTouched({
      title: true,
      title_en: true,
      cover_url: true,
      sort_order: true,
      media: true,
      video_urls: true,
    })

    if (Object.keys(errors).length > 0 || saving) return

    setSaving(true)

    try {
      const collectionPayload = buildCollectionPayload()
      const items = await uploadNewItems(collectionPayload)

      if (editCollectionId) {
        await api.put(
          `/gallery/collections/${editCollectionId}`,
          collectionPayload
        )

        if (items.length) {
          await api.post(`/gallery/collections/${editCollectionId}/items`, {
            items,
          })
        }
      } else {
        await api.post('/gallery/collections', {
          collection: collectionPayload,
          items,
        })
      }

      toast.success(
        editCollectionId
          ? isRtl
            ? 'تم تحديث المجموعة بنجاح'
            : 'Collection updated successfully'
          : isRtl
            ? 'تم حفظ المجموعة بنجاح'
            : 'Collection saved successfully',
        toastTheme.success
      )

      await load()
      closeModal()
    } catch (error) {
      toast.error(
        error?.message || (isRtl ? 'حدث خطأ' : 'Something went wrong'),
        toastTheme.error
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCollection = async (collection) => {
    const confirmed = await requestConfirm({
      title: isRtl ? 'تأكيد حذف المجموعة' : 'Delete collection?',
      message: isRtl
        ? 'سيتم حذف المجموعة وجميع الصور أو الفيديوهات التابعة لها نهائيًا.'
        : 'The collection and all of its media will be permanently removed.',
      variant: 'danger',
      confirmText: t.delete,
    })

    if (!confirmed) return

    try {
      await api.delete(`/gallery/collections/${collection.id}`)
      toast.success(
        isRtl ? 'تم حذف المجموعة بنجاح' : 'Collection deleted successfully',
        toastTheme.success
      )
      await load()
    } catch (error) {
      toast.error(
        error?.message || (isRtl ? 'حدث خطأ أثناء الحذف' : 'Delete failed'),
        toastTheme.error
      )
    }
  }

  const handleDeleteItem = async (item) => {
    const confirmed = await requestConfirm({
      title: isRtl ? 'حذف العنصر؟' : 'Delete item?',
      message: isRtl
        ? 'سيتم حذف هذا العنصر من المجموعة نهائيًا.'
        : 'This item will be permanently removed from the collection.',
      variant: 'danger',
      confirmText: t.delete,
    })

    if (!confirmed) return

    try {
      await api.delete(`/gallery/items/${item.id}`)
      setCollectionItems((current) =>
        current.filter((currentItem) => currentItem.id !== item.id)
      )
      await load()
    } catch (error) {
      toast.error(error?.message || t.error, toastTheme.error)
    }
  }

  const getTitle = (item) => {
    if (isRtl) return item.title || item.title_en || '—'
    return item.title_en || item.title || '—'
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark sm:text-3xl">
            {pageTitle}
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            {isRtl
              ? 'إدارة مجموعات الصور والفيديوهات. لا توجد حقول وصف؛ العنوان فقط.'
              : 'Manage photo and video collections. Collections use titles only.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => openAddCollection('photo')}
            className="btn-primary justify-center"
          >
            <ImageIcon size={17} />
            {isRtl ? 'إضافة مجموعة صور' : 'Add Photo Collection'}
          </button>

          <button
            type="button"
            onClick={() => openAddCollection('video')}
            className="btn-primary justify-center"
          >
            <Video size={17} />
            {isRtl ? 'إضافة مجموعة فيديوهات' : 'Add Video Collection'}
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterButton
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label={`${isRtl ? 'الكل' : 'All'} (${collections.length})`}
        />
        <FilterButton
          active={filter === 'photo'}
          onClick={() => setFilter('photo')}
          label={`${isRtl ? 'الصور' : 'Photos'} (${photosCount})`}
        />
        <FilterButton
          active={filter === 'video'}
          onClick={() => setFilter('video')}
          label={`${isRtl ? 'الفيديوهات' : 'Videos'} (${videosCount})`}
        />
      </div>

      {loading ? null : filteredCollections.length === 0 ? (
        <EmptyState
          text={isRtl ? 'لا توجد مجموعات' : 'No collections found'}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCollections.map((collection) => (
            <article
              key={collection.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <CollectionCover collection={collection} />

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="line-clamp-2 font-bold text-dark">
                      {getTitle(collection)}
                    </h2>
                    <p className="mt-1 text-xs text-gray-400">
                      {collection.type === 'photo'
                        ? isRtl
                          ? 'مجموعة صور'
                          : 'Photo collection'
                        : isRtl
                          ? 'مجموعة فيديوهات'
                          : 'Video collection'}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                      isActive(collection.is_active)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isActive(collection.is_active)
                      ? isRtl
                        ? 'نشط'
                        : 'Active'
                      : isRtl
                        ? 'مخفي'
                        : 'Hidden'}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-3 text-center text-xs">
                  <div>
                    <div className="font-bold text-dark">
                      {toNumber(collection.items_count)}
                    </div>
                    <div className="mt-1 text-gray-400">
                      {isRtl ? 'عنصر' : 'Items'}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-dark">
                      {toNumber(collection.events_count)}
                    </div>
                    <div className="mt-1 text-gray-400">
                      {isRtl ? 'فعالية' : 'Events'}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-dark">
                      {collection.sort_order || 0}
                    </div>
                    <div className="mt-1 text-gray-400">
                      {isRtl ? 'الترتيب' : 'Order'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openEditCollection(collection)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-50 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                  >
                    <Edit size={16} />
                    {t.edit}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCollection(collection)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    {t.delete}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title={
          editCollectionId
            ? isRtl
              ? 'تعديل المجموعة'
              : 'Edit Collection'
            : form.type === 'photo'
              ? isRtl
                ? 'إضافة مجموعة صور'
                : 'Add Photo Collection'
              : isRtl
                ? 'إضافة مجموعة فيديوهات'
                : 'Add Video Collection'
        }
        subtitle={
          form.type === 'video'
            ? isRtl
              ? 'يمكنك إضافة روابط مباشرة أو رفع ملفات فيديو إلى Supabase.'
              : 'Add direct links or upload video files to Supabase.'
            : isRtl
              ? `يمكن رفع حتى ${MAX_IMAGES} صورة للمجموعة.`
              : `Upload up to ${MAX_IMAGES} images per collection.`
        }
        icon={form.type === 'video' ? Film : ImageIcon}
        isRtl={isRtl}
        size="wide"
        onClose={closeModal}
        closeDisabled={saving}
        footer={
          <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="btn-outline justify-center"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || Object.keys(errors).length > 0}
              className="btn-primary justify-center"
            >
              <Save size={16} />
              {saving ? t.saving : t.save}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedField
              label={isRtl ? 'عنوان المجموعة بالعربي' : 'Arabic Title'}
              value={form.title}
              onChange={(value) => updateForm('title', value)}
              onBlur={() => markTouched('title')}
              error={errors.title}
              touched={touched.title}
              required
              dir="rtl"
            />

            <ValidatedField
              label={isRtl ? 'عنوان المجموعة بالإنجليزي' : 'English Title'}
              value={form.title_en}
              onChange={(value) => updateForm('title_en', value)}
              onBlur={() => markTouched('title_en')}
              error={errors.title_en}
              touched={touched.title_en}
              dir="ltr"
            />

            <ValidatedField
              label={isRtl ? 'نوع المجموعة' : 'Collection Type'}
              value={form.type}
              onChange={(value) => updateForm('type', value)}
              onBlur={() => markTouched('type')}
              touched
              disabled={Boolean(editCollectionId)}
              as="select"
              options={[
                {
                  value: 'photo',
                  label: isRtl ? 'مجموعة صور' : 'Photo Collection',
                },
                {
                  value: 'video',
                  label: isRtl ? 'مجموعة فيديوهات' : 'Video Collection',
                },
              ]}
            />

            <ValidatedField
              label={isRtl ? 'الترتيب' : 'Sort Order'}
              value={form.sort_order}
              onChange={(value) => updateForm('sort_order', value)}
              onBlur={() => markTouched('sort_order')}
              error={errors.sort_order}
              touched={touched.sort_order}
              type="number"
              min="0"
              dir="ltr"
            />
          </div>

          {(editCollectionId || form.type === 'video') && (
            <ImageUpload
              value={form.cover_url}
              onChange={(value) => updateForm('cover_url', value)}
              folder={
                form.type === 'photo'
                  ? 'gallery/photos'
                  : 'gallery/video-covers'
              }
              label={isRtl ? 'غلاف المجموعة (اختياري)' : 'Collection Cover (Optional)'}
            />
          )}

          {form.type === 'photo' ? (
            <MediaPicker
              label={
                editCollectionId
                  ? isRtl
                    ? 'إضافة صور جديدة للمجموعة (اختياري)'
                    : 'Add New Images (Optional)'
                  : isRtl
                    ? 'صور المجموعة'
                    : 'Collection Images'
              }
              accept="image/*"
              files={photoFiles}
              onChange={handlePhotoFiles}
              icon={ImageIcon}
              error={errors.media}
              touched={touched.media}
              isRtl={isRtl}
              hint={
                isRtl
                  ? `حتى ${MAX_IMAGES} صورة، 10MB لكل صورة`
                  : `Up to ${MAX_IMAGES} images, 10MB each`
              }
            />
          ) : (
            <div className="space-y-5">
              <MediaPicker
                label={
                  editCollectionId
                    ? isRtl
                      ? 'رفع فيديوهات جديدة (اختياري)'
                      : 'Upload New Videos (Optional)'
                    : isRtl
                      ? 'رفع ملفات فيديو إلى Supabase'
                      : 'Upload Video Files to Supabase'
                }
                accept="video/*"
                files={videoFiles}
                onChange={handleVideoFiles}
                icon={UploadCloud}
                error={errors.media}
                touched={touched.media}
                isRtl={isRtl}
                hint={
                  isRtl
                    ? `حتى ${MAX_VIDEO_FILES} فيديوهات، 250MB لكل فيديو`
                    : `Up to ${MAX_VIDEO_FILES} videos, 250MB each`
                }
              />

              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-dark">
                      {isRtl ? 'روابط الفيديو المباشرة' : 'Direct Video Links'}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">
                      {isRtl
                        ? 'يدعم YouTube وVimeo وروابط ملفات الفيديو المباشرة.'
                        : 'Supports YouTube, Vimeo, and direct video file URLs.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addVideoUrl}
                    className="inline-flex h-9 items-center gap-1 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/20"
                  >
                    <Plus size={14} />
                    {isRtl ? 'إضافة رابط' : 'Add Link'}
                  </button>
                </div>

                <div className="space-y-2">
                  {videoUrls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="relative min-w-0 flex-1">
                        <LinkIcon
                          size={16}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="url"
                          value={url}
                          onChange={(event) =>
                            updateVideoUrl(index, event.target.value)
                          }
                          onBlur={() => markTouched('video_urls')}
                          className={`input-field pl-10 ${
                            touched.video_urls &&
                            url &&
                            !isValidHttpUrl(url)
                              ? 'border-red-400 ring-4 ring-red-50'
                              : ''
                          }`}
                          dir="ltr"
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>

                      {videoUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVideoUrl(index)}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                          aria-label={isRtl ? 'حذف الرابط' : 'Remove URL'}
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {touched.video_urls && errors.video_urls && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    {errors.video_urls}
                  </p>
                )}
              </div>
            </div>
          )}

          {editCollectionId && collectionItems.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-bold text-dark">
                {isRtl ? 'العناصر الحالية' : 'Current Items'}
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {collectionItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                  >
                    <ItemThumb item={item} type={form.type} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-xs font-semibold text-gray-700">
                        {item.title || form.title}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {form.type === 'photo'
                          ? isRtl
                            ? 'صورة'
                            : 'Photo'
                          : isRtl
                            ? 'فيديو'
                            : 'Video'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              checked={Boolean(form.is_active)}
              onChange={(event) => updateForm('is_active', event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span className="text-sm font-semibold text-gray-700">
              {isRtl ? 'إظهار المجموعة في الموقع' : 'Show collection on website'}
            </span>
          </label>
        </div>
      </AdminModal>
    </div>
  )
}

function MediaPicker({
  label,
  accept,
  files,
  onChange,
  icon: Icon,
  error,
  touched,
  isRtl,
  hint,
}) {
  const inputId = `${accept.includes('video') ? 'video' : 'photo'}-media-picker`

  return (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-gray-700">
        {label}
      </label>

      <input
        id={inputId}
        type="file"
        accept={accept}
        multiple
        onChange={onChange}
        className="hidden"
      />

      <label
        htmlFor={inputId}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
          touched && error
            ? 'border-red-300 bg-red-50/50'
            : 'border-primary/25 bg-primary/5 hover:border-primary/50 hover:bg-primary/10'
        }`}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-primary/10 transition group-hover:scale-105">
          <Icon size={23} />
        </div>
        <p className="text-sm font-bold text-dark">
          {isRtl ? 'اضغط لاختيار الملفات' : 'Click to choose files'}
        </p>
        <p className="mt-1 text-xs leading-5 text-gray-500">{hint}</p>
      </label>

      {touched && error && (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      )}

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {files.slice(0, 8).map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm"
              dir="ltr"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs font-semibold text-gray-700">
                  {file.name}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CollectionCover({ collection }) {
  if (collection.cover_url) {
    return (
      <img
        src={resolveMediaUrl(collection.cover_url)}
        alt=""
        className="aspect-[16/8] w-full bg-gray-50 object-cover"
      />
    )
  }

  return (
    <div className="flex aspect-[16/8] w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
      {collection.type === 'video' ? <Video size={34} /> : <ImageIcon size={34} />}
    </div>
  )
}

function ItemThumb({ item, type }) {
  const image = item.thumbnail_url || item.image_url

  if (image) {
    return (
      <img
        src={resolveMediaUrl(image)}
        alt=""
        className="h-12 w-12 shrink-0 rounded-lg object-cover"
      />
    )
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {type === 'video' ? <Video size={18} /> : <ImageIcon size={18} />}
    </div>
  )
}

function FilterButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-primary text-white shadow-sm'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">
      {text}
    </div>
  )
}
