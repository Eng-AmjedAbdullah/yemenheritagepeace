import { useContext, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'
import toast from 'react-hot-toast'
import ImageUpload from './ImageUpload'
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Image as ImageIcon,
  Video,
  UploadCloud,
} from 'lucide-react'
import { ConfirmContext } from './AdminLayout'
import { useAdminLang } from './adminI18n'

const MAX_IMAGES = 50

const EMPTY_COLLECTION = {
  title: '',
  title_en: '',
  description: '',
  description_en: '',
  type: 'photo',
  cover_url: '',
  sort_order: 0,
  is_active: true,
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
    duration: 4000,
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

export default function ManageGallery() {
  const { t, isRtl } = useAdminLang()
  const { requestConfirm } = useContext(ConfirmContext)

  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const [collectionModal, setCollectionModal] = useState(false)
  const [collectionForm, setCollectionForm] = useState(EMPTY_COLLECTION)
  const [editCollectionId, setEditCollectionId] = useState(null)

  const [selectedFiles, setSelectedFiles] = useState([])
  const [videoUrls, setVideoUrls] = useState([''])

  const pageTitle = isRtl ? 'إدارة المعرض' : 'Manage Gallery'

  const load = async () => {
    setLoading(true)

    try {
      const data = await api.get('/gallery/collections/all')
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

  const filteredCollections = useMemo(() => {
    if (filter === 'all') return collections
    return collections.filter((collection) => collection.type === filter)
  }, [collections, filter])

  const photosCount = collections.filter((collection) => collection.type === 'photo').length
  const videosCount = collections.filter((collection) => collection.type === 'video').length

  const updateCollectionForm = (key, value) => {
    setCollectionForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const openAddCollection = (type = 'photo') => {
    setCollectionForm({
      ...EMPTY_COLLECTION,
      type,
    })
    setEditCollectionId(null)
    setSelectedFiles([])
    setVideoUrls([''])
    setCollectionModal(true)
  }

  const openEditCollection = (collection) => {
    setCollectionForm({
      title: collection.title || '',
      title_en: collection.title_en || '',
      description: collection.description || '',
      description_en: collection.description_en || '',
      type: collection.type || 'photo',
      cover_url: collection.cover_url || '',
      sort_order: collection.sort_order || 0,
      is_active: isActive(collection.is_active),
    })

    setEditCollectionId(collection.id)
    setSelectedFiles([])
    setVideoUrls([''])
    setCollectionModal(true)
  }

  const closeCollectionModal = () => {
    setCollectionModal(false)
    setCollectionForm(EMPTY_COLLECTION)
    setEditCollectionId(null)
    setSelectedFiles([])
    setVideoUrls([''])
  }

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files || [])

    if (files.length > MAX_IMAGES) {
      toast.error(
        isRtl
          ? `الحد الأقصى ${MAX_IMAGES} صورة في المرة الواحدة`
          : `Maximum ${MAX_IMAGES} images at once`,
        toastTheme.error
      )

      event.target.value = ''
      setSelectedFiles([])
      return
    }

    setSelectedFiles(files)
  }

  const addVideoUrl = () => {
    setVideoUrls((current) => [...current, ''])
  }

  const updateVideoUrl = (index, value) => {
    setVideoUrls((current) =>
      current.map((url, currentIndex) => (currentIndex === index ? value : url))
    )
  }

  const removeVideoUrl = (index) => {
    setVideoUrls((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index)
      return next.length ? next : ['']
    })
  }

  const getCleanVideoUrls = () => {
    return videoUrls.map((url) => url.trim()).filter(Boolean)
  }

  const validateCollection = () => {
    if (!collectionForm.title.trim()) {
      return isRtl ? 'عنوان المجموعة العربي مطلوب' : 'Arabic collection title is required'
    }

    if (!editCollectionId && collectionForm.type === 'photo' && selectedFiles.length === 0) {
      return isRtl ? 'اختر صورة واحدة على الأقل' : 'Choose at least one image'
    }

    if (!editCollectionId && collectionForm.type === 'photo' && selectedFiles.length > MAX_IMAGES) {
      return isRtl
        ? `الحد الأقصى ${MAX_IMAGES} صورة في المجموعة الواحدة`
        : `Maximum ${MAX_IMAGES} images are allowed in one collection`
    }

    if (!editCollectionId && collectionForm.type === 'video' && getCleanVideoUrls().length === 0) {
      return isRtl ? 'أضف رابط فيديو واحد على الأقل' : 'Add at least one video URL'
    }

    return ''
  }

  const buildCollectionPayload = () => {
    return {
      title: collectionForm.title.trim(),
      title_en: collectionForm.title_en.trim(),
      description: collectionForm.description.trim(),
      description_en: collectionForm.description_en.trim(),
      type: collectionForm.type,
      cover_url: collectionForm.cover_url || '',
      sort_order: toNumber(collectionForm.sort_order),
      is_active: !!collectionForm.is_active,
    }
  }

  const handleSaveCollection = async () => {
    const validationError = validateCollection()

    if (validationError) {
      toast.error(validationError, toastTheme.error)
      return
    }

    if (saving) return
    setSaving(true)

    try {
      const collectionPayload = buildCollectionPayload()

      if (editCollectionId) {
        await api.put(`/gallery/collections/${editCollectionId}`, collectionPayload)

        toast.success(
          isRtl ? 'تم تحديث المجموعة بنجاح' : 'Collection updated successfully',
          toastTheme.success
        )

        await load()
        closeCollectionModal()
        return
      }

      let items = []

      if (collectionPayload.type === 'photo') {
        const uploaded = await api.uploadMany(selectedFiles, 'gallery/photos')

        items = (uploaded.files || []).map((file, index) => ({
          title: collectionPayload.title,
          title_en: collectionPayload.title_en,
          description: collectionPayload.description,
          description_en: collectionPayload.description_en,
          image_url: file.url,
          thumbnail_url: file.url,
          video_url: '',
          sort_order: index + 1,
          is_active: true,
        }))
      }

      if (collectionPayload.type === 'video') {
        const urls = getCleanVideoUrls()

        items = urls.map((url, index) => ({
          title: collectionPayload.title,
          title_en: collectionPayload.title_en,
          description: collectionPayload.description,
          description_en: collectionPayload.description_en,
          image_url: '',
          thumbnail_url: collectionPayload.cover_url || '',
          video_url: url,
          sort_order: index + 1,
          is_active: true,
        }))
      }

      await api.post('/gallery/collections', {
        collection: collectionPayload,
        items,
      })

      toast.success(
        isRtl ? 'تم حفظ المجموعة بنجاح' : 'Collection saved successfully',
        toastTheme.success
      )

      await load()
      closeCollectionModal()
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
        ? 'سيتم حذف هذه المجموعة وجميع العناصر التابعة لها نهائيًا.'
        : 'This collection and all its items will be permanently removed.',
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
        error?.message || (isRtl ? 'حدث خطأ أثناء الحذف' : 'Failed to delete'),
        toastTheme.error
      )
    }
  }

  const getTitle = (item) => {
    if (isRtl) return item.title || item.title_en || '—'
    return item.title_en || item.title || '—'
  }

  const getDescription = (item) => {
    if (isRtl) return item.description || item.description_en || ''
    return item.description_en || item.description || ''
  }

  const getItemsCount = (collection) => {
    return toNumber(collection.items_count)
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark md:text-3xl">
            {pageTitle}
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isRtl
              ? 'إدارة مجموعات الصور والفيديوهات المعروضة في الموقع'
              : 'Manage public photo and video collections'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => openAddCollection('photo')}
            className="btn-primary justify-center"
          >
            <ImageIcon size={16} />
            {isRtl ? 'إضافة مجموعة صور' : 'Add Photo Collection'}
          </button>

          <button
            type="button"
            onClick={() => openAddCollection('video')}
            className="btn-primary justify-center"
          >
            <Video size={16} />
            {isRtl ? 'إضافة مجموعة فيديوهات' : 'Add Video Collection'}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
          <FilterButton
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label={`${isRtl ? 'الكل' : 'All'} (${collections.length})`}
          />

          <FilterButton
            active={filter === 'photo'}
            onClick={() => setFilter('photo')}
            label={`${isRtl ? 'مجموعات الصور' : 'Photo Collections'} (${photosCount})`}
          />

          <FilterButton
            active={filter === 'video'}
            onClick={() => setFilter('video')}
            label={`${isRtl ? 'مجموعات الفيديو' : 'Video Collections'} (${videosCount})`}
          />
        </div>
      </div>

      <div className="md:hidden">
        {loading ? (
          <EmptyState text={t.loading} />
        ) : filteredCollections.length === 0 ? (
          <EmptyState text={isRtl ? 'لا توجد مجموعات' : 'No collections found'} />
        ) : (
          <div className="space-y-3">
            {filteredCollections.map((collection) => (
              <div
                key={collection.id}
                className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  <CollectionThumb collection={collection} />

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-bold leading-6 text-dark">
                        {getTitle(collection)}
                      </h3>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
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

                    {getDescription(collection) && (
                      <p className="mb-2 line-clamp-2 text-xs leading-6 text-gray-500">
                        {getDescription(collection)}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {collection.type === 'photo'
                          ? isRtl
                            ? 'مجموعة صور'
                            : 'Photo Collection'
                          : isRtl
                            ? 'مجموعة فيديو'
                            : 'Video Collection'}
                      </span>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                        {getItemsCount(collection)} {isRtl ? 'عنصر' : 'Items'}
                      </span>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                        {isRtl ? 'الترتيب' : 'Order'}: {collection.sort_order || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    onClick={() => openEditCollection(collection)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600"
                  >
                    <Edit size={15} />
                    {t.edit}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCollection(collection)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600"
                  >
                    <Trash2 size={15} />
                    {t.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] table-fixed text-sm">
            <colgroup>
              <col className="w-[120px]" />
              <col className="w-[320px]" />
              <col className="w-[150px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
              <col className="w-[110px]" />
              <col className="w-[120px]" />
            </colgroup>

            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <TableHead isRtl={isRtl}>{isRtl ? 'الغلاف' : 'Cover'}</TableHead>
                <TableHead isRtl={isRtl}>{t.title}</TableHead>
                <TableHead isRtl={isRtl}>{isRtl ? 'النوع' : 'Type'}</TableHead>
                <TableHead isRtl={isRtl}>{isRtl ? 'العناصر' : 'Items'}</TableHead>
                <TableHead isRtl={isRtl}>{isRtl ? 'الترتيب' : 'Order'}</TableHead>
                <TableHead isRtl={isRtl}>{t.status}</TableHead>
                <TableHead isRtl={isRtl}>{t.actions}</TableHead>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    {t.loading}
                  </td>
                </tr>
              ) : filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    {isRtl ? 'لا توجد مجموعات' : 'No collections found'}
                  </td>
                </tr>
              ) : (
                filteredCollections.map((collection) => (
                  <tr
                    key={collection.id}
                    className="border-b border-gray-50 transition hover:bg-gray-50/70"
                  >
                    <td className="p-4">
                      <CollectionThumb collection={collection} small />
                    </td>

                    <td className="p-4 font-medium text-dark">
                      <div className="line-clamp-1">{getTitle(collection)}</div>

                      {collection.title_en && isRtl && (
                        <div className="line-clamp-1 text-xs text-gray-400" dir="ltr">
                          {collection.title_en}
                        </div>
                      )}

                      {getDescription(collection) && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-400">
                          {getDescription(collection)}
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                        {collection.type === 'photo'
                          ? isRtl
                            ? 'مجموعة صور'
                            : 'Photo Collection'
                          : isRtl
                            ? 'مجموعة فيديو'
                            : 'Video Collection'}
                      </span>
                    </td>

                    <td className="p-4 text-gray-500">
                      {getItemsCount(collection)}
                    </td>

                    <td className="p-4 text-gray-500">
                      {collection.sort_order || 0}
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
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
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditCollection(collection)}
                          className="rounded-lg p-2 text-blue-500 transition hover:bg-blue-50"
                          aria-label={t.edit}
                        >
                          <Edit size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCollection(collection)}
                          className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                          aria-label={t.delete}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {collectionModal && (
        <div
          className="modal-overlay"
          onClick={(event) =>
            event.target === event.currentTarget && closeCollectionModal()
          }
        >
          <div className="modal-box max-h-[90vh] w-[calc(100vw-24px)] max-w-4xl overflow-y-auto">
            <div className="flex items-center justify-between border-b p-4 sm:p-6">
              <div>
                <h2 className="text-lg font-bold text-dark sm:text-xl">
                  {editCollectionId
                    ? isRtl
                      ? 'تعديل المجموعة'
                      : 'Edit Collection'
                    : collectionForm.type === 'photo'
                      ? isRtl
                        ? 'إضافة مجموعة صور'
                        : 'Add Photo Collection'
                      : isRtl
                        ? 'إضافة مجموعة فيديوهات'
                        : 'Add Video Collection'}
                </h2>

                <p className="mt-1 text-xs leading-5 text-gray-500 sm:text-sm">
                  {editCollectionId
                    ? isRtl
                      ? 'يمكنك تعديل بيانات المجموعة والغلاف والحالة.'
                      : 'You can edit collection details, cover, and status.'
                    : collectionForm.type === 'photo'
                      ? isRtl
                        ? `اختر حتى ${MAX_IMAGES} صورة واحفظها كمجموعة واحدة.`
                        : `Choose up to ${MAX_IMAGES} images and save them as one collection.`
                      : isRtl
                        ? 'اضغط زر + لإضافة أكثر من رابط فيديو داخل نفس المجموعة.'
                        : 'Press + to add multiple video URLs inside one collection.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCollectionModal}
                className="text-gray-400 transition hover:text-gray-600"
                aria-label={isRtl ? 'إغلاق' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {isRtl ? 'نوع المجموعة' : 'Collection Type'}
                  </label>

                  <select
                    value={collectionForm.type}
                    onChange={(event) => updateCollectionForm('type', event.target.value)}
                    className="input-field"
                    disabled={!!editCollectionId}
                  >
                    <option value="photo">{isRtl ? 'مجموعة صور' : 'Photo Collection'}</option>
                    <option value="video">{isRtl ? 'مجموعة فيديوهات' : 'Video Collection'}</option>
                  </select>

                  {editCollectionId && (
                    <p className="mt-1 text-xs text-gray-400">
                      {isRtl
                        ? 'لا يمكن تغيير نوع المجموعة بعد إنشائها.'
                        : 'Collection type cannot be changed after creation.'}
                    </p>
                  )}
                </div>

                <Field
                  label={isRtl ? 'الترتيب' : 'Order'}
                  type="number"
                  value={collectionForm.sort_order}
                  onChange={(value) => updateCollectionForm('sort_order', value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  label={`${isRtl ? 'عنوان المجموعة بالعربي' : 'Arabic Collection Title'} *`}
                  value={collectionForm.title}
                  onChange={(value) => updateCollectionForm('title', value)}
                />

                <Field
                  label={isRtl ? 'عنوان المجموعة بالإنجليزي' : 'English Collection Title'}
                  value={collectionForm.title_en}
                  onChange={(value) => updateCollectionForm('title_en', value)}
                  dir="ltr"
                />
              </div>

              {(editCollectionId || collectionForm.type === 'video') && (
                <ImageUpload
                  value={collectionForm.cover_url}
                  onChange={(value) => updateCollectionForm('cover_url', value)}
                  folder={
                    collectionForm.type === 'photo'
                      ? 'gallery/photos'
                      : 'gallery/videos'
                  }
                  label={
                    collectionForm.type === 'photo'
                      ? isRtl
                        ? 'غلاف المجموعة'
                        : 'Collection Cover'
                      : isRtl
                        ? 'غلاف مجموعة الفيديوهات'
                        : 'Video Collection Cover'
                  }
                />
              )}

              {!editCollectionId && collectionForm.type === 'photo' && (
                <PhotoFilesPicker
                  files={selectedFiles}
                  isRtl={isRtl}
                  maxImages={MAX_IMAGES}
                  onChange={handleFilesChange}
                />
              )}

              {!editCollectionId && collectionForm.type === 'video' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-gray-700">
                      {isRtl ? 'روابط الفيديوهات' : 'Video URLs'}
                    </label>

                    <button
                      type="button"
                      onClick={addVideoUrl}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark"
                    >
                      <Plus size={16} />
                      {isRtl ? 'إضافة رابط' : 'Add URL'}
                    </button>
                  </div>

                  {videoUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        value={url}
                        onChange={(event) => updateVideoUrl(index, event.target.value)}
                        className="input-field"
                        dir="ltr"
                        placeholder="https://youtube.com/watch?v=..."
                      />

                      {videoUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVideoUrl(index)}
                          className="rounded-xl bg-red-50 px-3 text-red-600 transition hover:bg-red-100"
                          aria-label={isRtl ? 'حذف الرابط' : 'Remove URL'}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {editCollectionId && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-7 text-amber-700">
                  {isRtl
                    ? 'ملاحظة: هذا التعديل يغير بيانات المجموعة فقط. إضافة صور أو روابط جديدة تكون من زر إضافة مجموعة جديدة.'
                    : 'Note: this edit changes collection metadata only. To add new photos or video URLs, create a new collection.'}
                </div>
              )}

              <TextArea
                label={isRtl ? 'وصف المجموعة بالعربي' : 'Arabic Description'}
                value={collectionForm.description}
                onChange={(value) => updateCollectionForm('description', value)}
              />

              <TextArea
                label={isRtl ? 'وصف المجموعة بالإنجليزي' : 'English Description'}
                value={collectionForm.description_en}
                onChange={(value) => updateCollectionForm('description_en', value)}
                dir="ltr"
              />

              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-gray-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={!!collectionForm.is_active}
                  onChange={(event) =>
                    updateCollectionForm('is_active', event.target.checked)
                  }
                  className="h-4 w-4 accent-primary"
                />

                <span className="text-sm text-gray-700">
                  {isRtl ? 'إظهار في الموقع' : 'Show on website'}
                </span>
              </label>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t p-4 sm:flex-row sm:justify-end sm:p-6">
              <button
                type="button"
                onClick={closeCollectionModal}
                className="btn-outline justify-center"
              >
                {t.cancel}
              </button>

              <button
                type="button"
                onClick={handleSaveCollection}
                disabled={saving}
                className="btn-primary justify-center"
              >
                <Save size={16} />
                {saving ? t.saving : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PhotoFilesPicker({ files, isRtl, maxImages, onChange }) {
  const fileInputId = 'gallery-photo-files-input'

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {isRtl ? 'اختيار الصور' : 'Choose Images'}
      </label>

      <input
        id={fileInputId}
        type="file"
        accept="image/*"
        multiple
        onChange={onChange}
        className="hidden"
      />

      <label
        htmlFor={fileInputId}
        className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/25 bg-primary/5 px-4 py-7 text-center transition hover:border-primary/50 hover:bg-primary/10"
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-primary/10 transition group-hover:scale-105">
          <UploadCloud size={26} />
        </div>

        <div className="text-sm font-bold text-dark">
          {isRtl ? 'اضغط لاختيار الصور' : 'Click to choose images'}
        </div>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {isRtl
            ? `يمكنك رفع حتى ${maxImages} صورة داخل المجموعة الواحدة`
            : `You can upload up to ${maxImages} images in one collection`}
        </p>

        <span className="mt-4 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-primary-dark">
          <ImageIcon size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
          {isRtl ? 'تصفح الصور' : 'Browse Images'}
        </span>
      </label>

      <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-xs leading-6 text-gray-500">
        {isRtl
          ? `تم اختيار ${files.length} صورة. الحد الأقصى ${maxImages} صورة.`
          : `${files.length} images selected. Maximum ${maxImages} images.`}
      </div>

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
          {files.slice(0, 9).map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm"
              dir="ltr"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ImageIcon size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-xs font-semibold text-gray-700">
                  {file.name}
                </div>

                <div className="mt-0.5 text-[11px] text-gray-400">
                  {formatFileSize(file.size)}
                </div>
              </div>
            </div>
          ))}

          {files.length > 9 && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500">
              +{files.length - 9}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CollectionThumb({ collection, small = false }) {
  const sizeClass = small ? 'h-14 w-20' : 'h-24 w-24'
  const src = collection.cover_url

  if (src) {
    return (
      <img
        src={resolveMediaUrl(src)}
        alt=""
        className={`${sizeClass} shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-cover`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-gray-50 text-gray-400`}
    >
      {collection.type === 'video' ? <Video size={22} /> : <ImageIcon size={22} />}
    </div>
  )
}

function FilterButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
        active
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

function TableHead({ children, isRtl }) {
  return (
    <th
      className={`${isRtl ? 'text-right' : 'text-left'} p-4 font-semibold text-gray-600`}
    >
      {children}
    </th>
  )
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-400 shadow-sm">
      {text}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  dir,
  placeholder = '',
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="input-field"
        dir={dir || ''}
        placeholder={placeholder}
      />
    </div>
  )
}

function TextArea({ label, value, onChange, dir }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <textarea
        rows={3}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="input-field resize-none"
        dir={dir || ''}
      />
    </div>
  )
}
