import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'

import toast from 'react-hot-toast'

import {
  Edit,
  Film,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  Video,
  X,
} from 'lucide-react'

import api from '../lib/api'
import { resolveMediaUrl } from '../lib/media'

import AdminModal from './AdminModal'
import ValidatedField from './ValidatedField'

import {
  ConfirmContext,
} from './AdminLayout'

import {
  useAdminLang,
} from './adminI18n'

const MAX_IMAGES = 50
const MAX_VIDEO_FILES = 10

const MAX_IMAGE_SIZE =
  10 * 1024 * 1024

const MAX_VIDEO_SIZE =
  250 * 1024 * 1024

const VIDEO_UPLOAD_TIMEOUT =
  45 * 60 * 1000

const EMPTY_COLLECTION = {
  title: '',
  title_en: '',
  type: 'photo',
  sort_order: 0,
  is_active: true,
}

const EMPTY_TOUCHED = {
  title: false,
  title_en: false,
  sort_order: false,
  media: false,
  video_urls: false,
}

const EMPTY_UPLOAD_PROGRESS = {
  active: false,
  stage: 'idle',
  fileName: '',
  current: 0,
  total: 0,
  percent: 0,
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
    duration: 5000,

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

const VIDEO_EXTENSION_TYPES = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogg: 'video/ogg',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  mkv: 'video/x-matroska',
}

function isActive(value) {
  return (
    value === true ||
    value === 1 ||
    value === '1'
  )
}

function toNumber(value) {
  const number = Number(value)

  return Number.isFinite(number)
    ? number
    : 0
}

function formatFileSize(bytes) {
  if (!bytes) {
    return '0 KB'
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(
      1,
      Math.round(bytes / 1024)
    )} KB`
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`
}

function isValidHttpUrl(value) {
  if (!value) {
    return true
  }

  try {
    const parsed = new URL(value)

    return (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:'
    )
  } catch {
    return false
  }
}

function getFileExtension(fileName) {
  const segments =
    String(fileName || '')
      .toLowerCase()
      .split('.')

  return segments.length > 1
    ? segments.pop()
    : ''
}

function isSupportedVideoFile(file) {
  if (!file) {
    return false
  }

  if (
    String(file.type || '')
      .toLowerCase()
      .startsWith('video/')
  ) {
    return true
  }

  const extension =
    getFileExtension(file.name)

  return Boolean(
    VIDEO_EXTENSION_TYPES[extension]
  )
}

function normalizeVideoFile(file) {
  if (!file || file.type) {
    return file
  }

  const extension =
    getFileExtension(file.name)

  const inferredType =
    VIDEO_EXTENSION_TYPES[extension]

  if (!inferredType) {
    return file
  }

  try {
    return new File(
      [file],
      file.name,
      {
        type: inferredType,
        lastModified:
          file.lastModified,
      }
    )
  } catch {
    return file
  }
}

function resolveCollectionMediaUrl(value) {
  const cleanValue =
    String(value || '').trim()

  if (!cleanValue) {
    return ''
  }

  if (
    /^https?:\/\//i.test(
      cleanValue
    )
  ) {
    return cleanValue
  }

  return resolveMediaUrl(cleanValue)
}

function isDirectPlayableVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(
    String(url || '')
  )
}

function getItemMediaUrl(item) {
  return (
    item?.thumbnail_url ||
    item?.image_url ||
    item?.video_url ||
    ''
  )
}

function normalizeErrorMessage(
  error,
  isRtl
) {
  if (
    error?.name ===
    'AbortError'
  ) {
    return isRtl
      ? 'تم إلغاء عملية رفع الملفات.'
      : 'The file upload was cancelled.'
  }

  const rawMessage =
    String(
      error?.message || ''
    ).trim()

  const lowerMessage =
    rawMessage.toLowerCase()

  if (
    lowerMessage.includes('413') ||
    lowerMessage.includes(
      'too large'
    ) ||
    lowerMessage.includes(
      'file size'
    ) ||
    lowerMessage.includes(
      'payload too large'
    ) ||
    lowerMessage.includes(
      'maximum'
    )
  ) {
    return isRtl
      ? 'حجم الملف يتجاوز الحد المسموح به في إعدادات التخزين أو الخادم.'
      : 'The file exceeds the size limit configured for storage or the server.'
  }

  if (
    lowerMessage.includes(
      'timeout'
    ) ||
    lowerMessage.includes(
      'timed out'
    ) ||
    lowerMessage.includes(
      'انتهت مهلة'
    )
  ) {
    return isRtl
      ? 'انتهت مهلة رفع الملف. تحقق من سرعة الإنترنت ثم أعد المحاولة.'
      : 'The upload timed out. Check your internet connection and try again.'
  }

  if (
    lowerMessage.includes(
      'failed to fetch'
    ) ||
    lowerMessage.includes(
      'network'
    ) ||
    lowerMessage.includes(
      'connection'
    )
  ) {
    return isRtl
      ? 'انقطع الاتصال أثناء رفع الملف. تحقق من الإنترنت ثم أعد المحاولة.'
      : 'The connection failed during upload. Check your internet connection and try again.'
  }

  if (
    lowerMessage.includes(
      'signed'
    ) ||
    lowerMessage.includes(
      'upload information'
    )
  ) {
    return isRtl
      ? 'تعذر تجهيز رابط رفع الفيديو. تحقق من إعدادات الخادم والتخزين.'
      : 'Unable to prepare the video upload URL. Check the server and storage settings.'
  }

  if (rawMessage) {
    return rawMessage
  }

  return isRtl
    ? 'حدث خطأ غير متوقع أثناء حفظ المجموعة.'
    : 'An unexpected error occurred while saving the collection.'
}

function validateForm(
  form,
  options
) {
  const {
    isRtl,
    editCollectionId,
    photoFiles,
    videoFiles,
    videoUrls,
  } = options

  const errors = {}

  if (!form.title.trim()) {
    errors.title = isRtl
      ? 'عنوان المجموعة مطلوب'
      : 'Collection title is required'
  } else if (
    form.title.trim().length >
    180
  ) {
    errors.title = isRtl
      ? 'العنوان طويل جدًا، الحد الأقصى 180 حرفًا'
      : 'Title is too long. Maximum is 180 characters'
  }

  if (
    form.title_en.trim().length >
    180
  ) {
    errors.title_en = isRtl
      ? 'العنوان الإنجليزي طويل جدًا'
      : 'English title is too long'
  }

  if (
    toNumber(
      form.sort_order
    ) < 0
  ) {
    errors.sort_order = isRtl
      ? 'الترتيب لا يمكن أن يكون سالبًا'
      : 'Order cannot be negative'
  }

  if (
    !editCollectionId &&
    form.type === 'photo' &&
    photoFiles.length === 0
  ) {
    errors.media = isRtl
      ? 'اختر صورة واحدة على الأقل'
      : 'Choose at least one image'
  }

  const cleanVideoUrls =
    videoUrls
      .map((url) =>
        url.trim()
      )
      .filter(Boolean)

  if (
    !editCollectionId &&
    form.type === 'video' &&
    cleanVideoUrls.length === 0 &&
    videoFiles.length === 0
  ) {
    errors.media = isRtl
      ? 'أضف رابط فيديو أو ارفع ملف فيديو واحدًا على الأقل من جهازك'
      : 'Add a video URL or upload at least one video file from your device'
  }

  if (
    cleanVideoUrls.some(
      (url) =>
        !isValidHttpUrl(url)
    )
  ) {
    errors.video_urls = isRtl
      ? 'يوجد رابط فيديو غير صحيح'
      : 'One or more video URLs are invalid'
  }

  return errors
}

export default function ManageGallery() {
  const {
    t,
    isRtl,
  } = useAdminLang()

  const {
    requestConfirm,
  } = useContext(
    ConfirmContext
  )

  const uploadAbortRef =
    useRef(null)

  const [
    collections,
    setCollections,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    filter,
    setFilter,
  ] = useState('all')

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false)

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_COLLECTION
  )

  const [
    touched,
    setTouched,
  ] = useState(
    EMPTY_TOUCHED
  )

  const [
    editCollectionId,
    setEditCollectionId,
  ] = useState(null)

  const [
    collectionItems,
    setCollectionItems,
  ] = useState([])

  const [
    photoFiles,
    setPhotoFiles,
  ] = useState([])

  const [
    videoFiles,
    setVideoFiles,
  ] = useState([])

  const [
    videoUrls,
    setVideoUrls,
  ] = useState([''])

  const [
    currentCoverUrl,
    setCurrentCoverUrl,
  ] = useState('')

  const [
    uploadProgress,
    setUploadProgress,
  ] = useState(
    EMPTY_UPLOAD_PROGRESS
  )

  const pageTitle =
    isRtl
      ? 'إدارة المعرض'
      : 'Manage Gallery'

  const load =
    useCallback(async () => {
      setLoading(true)

      try {
        const data =
          await api.get(
            '/gallery/collections/all',
            {
              globalLoading:
                false,

              loadingLabel:
                'admin-gallery-collections',
            }
          )

        setCollections(
          Array.isArray(data)
            ? data
            : []
        )
      } catch (error) {
        console.error(
          'Failed to load gallery collections:',
          error
        )

        setCollections([])

        toast.error(
          normalizeErrorMessage(
            error,
            isRtl
          ),
          toastTheme.error
        )
      } finally {
        setLoading(false)
      }
    }, [isRtl])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    return () => {
      uploadAbortRef.current?.abort()
    }
  }, [])

  const errors =
    useMemo(
      () =>
        validateForm(
          form,
          {
            isRtl,
            editCollectionId,
            photoFiles,
            videoFiles,
            videoUrls,
          }
        ),
      [
        form,
        isRtl,
        editCollectionId,
        photoFiles,
        videoFiles,
        videoUrls,
      ]
    )

  const filteredCollections =
    useMemo(() => {
      if (
        filter === 'all'
      ) {
        return collections
      }

      return collections.filter(
        (collection) =>
          collection.type ===
          filter
      )
    }, [
      collections,
      filter,
    ])

  const photosCount =
    collections.filter(
      (collection) =>
        collection.type ===
        'photo'
    ).length

  const videosCount =
    collections.filter(
      (collection) =>
        collection.type ===
        'video'
    ).length

  const markTouched =
    (field) => {
      setTouched(
        (current) => ({
          ...current,
          [field]: true,
        })
      )
    }

  const updateForm = (
    key,
    value
  ) => {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    )

    setTouched(
      (current) => ({
        ...current,
        [key]: true,
      })
    )
  }

  const resetModalState =
    () => {
      setForm(
        EMPTY_COLLECTION
      )

      setTouched(
        EMPTY_TOUCHED
      )

      setEditCollectionId(
        null
      )

      setCollectionItems([])

      setPhotoFiles([])
      setVideoFiles([])
      setVideoUrls([''])

      setCurrentCoverUrl('')

      setUploadProgress(
        EMPTY_UPLOAD_PROGRESS
      )

      uploadAbortRef.current =
        null
    }

  const openAddCollection =
    (type) => {
      resetModalState()

      setForm({
        ...EMPTY_COLLECTION,
        type,
      })

      setModalOpen(true)
    }

  const openEditCollection =
    async (collection) => {
      resetModalState()

      setEditCollectionId(
        collection.id
      )

      setCurrentCoverUrl(
        collection.cover_url ||
          ''
      )

      setForm({
        title:
          collection.title ||
          '',

        title_en:
          collection.title_en ||
          '',

        type:
          collection.type ||
          'photo',

        sort_order:
          collection.sort_order ||
          0,

        is_active:
          isActive(
            collection.is_active
          ),
      })

      setModalOpen(true)

      try {
        const detail =
          await api.get(
            `/gallery/collections/${collection.id}`,
            {
              globalLoading:
                false,

              loadingLabel:
                'admin-gallery-collection-detail',
            }
          )

        const items =
          Array.isArray(
            detail?.items
          )
            ? detail.items
            : []

        setCollectionItems(
          items
        )

        if (
          !collection.cover_url &&
          items.length > 0
        ) {
          setCurrentCoverUrl(
            getItemMediaUrl(
              items[0]
            )
          )
        }
      } catch (error) {
        console.error(
          'Failed to load collection items:',
          error
        )

        setCollectionItems([])

        toast.error(
          normalizeErrorMessage(
            error,
            isRtl
          ),
          toastTheme.error
        )
      }
    }

  const closeModal = () => {
    if (saving) {
      return
    }

    setModalOpen(false)
    resetModalState()
  }

  const cancelUpload = () => {
    uploadAbortRef.current?.abort()
  }

  const handlePhotoFiles =
    (event) => {
      const files =
        Array.from(
          event.target.files ||
            []
        )

      const invalid =
        files.find(
          (file) =>
            !file.type.startsWith(
              'image/'
            ) ||
            file.size >
              MAX_IMAGE_SIZE
        )

      if (
        files.length >
        MAX_IMAGES
      ) {
        toast.error(
          isRtl
            ? `الحد الأقصى ${MAX_IMAGES} صورة في المرة الواحدة`
            : `Maximum ${MAX_IMAGES} images at once`,
          toastTheme.error
        )

        event.target.value =
          ''

        return
      }

      if (invalid) {
        toast.error(
          isRtl
            ? `الملف "${invalid.name}" ليس صورة صالحة أو حجمه أكبر من 10MB`
            : `"${invalid.name}" is not a valid image or is larger than 10MB`,
          toastTheme.error
        )

        event.target.value =
          ''

        return
      }

      setPhotoFiles(files)
      markTouched('media')

      event.target.value =
        ''
    }

  const handleVideoFiles =
    (event) => {
      const files =
        Array.from(
          event.target.files ||
            []
        )

      if (
        files.length >
        MAX_VIDEO_FILES
      ) {
        toast.error(
          isRtl
            ? `الحد الأقصى ${MAX_VIDEO_FILES} ملفات فيديو في المرة الواحدة`
            : `Maximum ${MAX_VIDEO_FILES} video files at once`,
          toastTheme.error
        )

        event.target.value =
          ''

        return
      }

      const unsupported =
        files.find(
          (file) =>
            !isSupportedVideoFile(
              file
            )
        )

      if (unsupported) {
        toast.error(
          isRtl
            ? `صيغة الملف "${unsupported.name}" غير مدعومة`
            : `The format of "${unsupported.name}" is not supported`,
          toastTheme.error
        )

        event.target.value =
          ''

        return
      }

      const oversized =
        files.find(
          (file) =>
            file.size >
            MAX_VIDEO_SIZE
        )

      if (oversized) {
        toast.error(
          isRtl
            ? `حجم الفيديو "${oversized.name}" يتجاوز 250MB`
            : `"${oversized.name}" is larger than 250MB`,
          toastTheme.error
        )

        event.target.value =
          ''

        return
      }

      setVideoFiles(files)
      markTouched('media')

      event.target.value =
        ''
    }

  const removePhotoFile =
    (index) => {
      setPhotoFiles(
        (current) =>
          current.filter(
            (_, currentIndex) =>
              currentIndex !==
              index
          )
      )

      markTouched('media')
    }

  const removeVideoFile =
    (index) => {
      setVideoFiles(
        (current) =>
          current.filter(
            (_, currentIndex) =>
              currentIndex !==
              index
          )
      )

      markTouched('media')
    }

  const addVideoUrl = () => {
    setVideoUrls(
      (current) => [
        ...current,
        '',
      ]
    )
  }

  const updateVideoUrl = (
    index,
    value
  ) => {
    setVideoUrls(
      (current) =>
        current.map(
          (
            url,
            currentIndex
          ) =>
            currentIndex ===
            index
              ? value
              : url
        )
    )

    markTouched(
      'video_urls'
    )

    markTouched('media')
  }

  const removeVideoUrl =
    (index) => {
      setVideoUrls(
        (current) => {
          const next =
            current.filter(
              (
                _,
                currentIndex
              ) =>
                currentIndex !==
                index
            )

          return next.length
            ? next
            : ['']
        }
      )

      markTouched(
        'video_urls'
      )

      markTouched('media')
    }

  const buildCollectionPayload =
    (coverUrl = currentCoverUrl) => ({
      title:
        form.title.trim(),

      title_en:
        form.title_en.trim(),

      type:
        form.type,

      cover_url:
        coverUrl || '',

      sort_order:
        toNumber(
          form.sort_order
        ),

      is_active:
        Boolean(
          form.is_active
        ),
    })

  const rollbackUploadedFiles =
    async (urls) => {
      const uniqueUrls =
        [
          ...new Set(
            urls.filter(Boolean)
          ),
        ]

      if (
        uniqueUrls.length === 0
      ) {
        return
      }

      await Promise.allSettled(
        uniqueUrls.map(
          (url) =>
            api.deleteUploadedFile(
              url,
              {
                globalLoading:
                  false,
              }
            )
        )
      )
    }

  const uploadPhotoItems =
    async (
      collectionPayload,
      signal
    ) => {
      const items = []
      const uploadedUrls = []

      for (
        let index = 0;
        index <
        photoFiles.length;
        index += 1
      ) {
        const file =
          photoFiles[index]

        setUploadProgress({
          active: true,
          stage: 'uploading',
          fileName:
            file.name,
          current:
            index + 1,
          total:
            photoFiles.length,
          percent: 0,
        })

        const uploaded =
          await api.upload(
            file,
            'gallery/photos',
            {
              globalLoading:
                false,

              signal,
            }
          )

        if (!uploaded?.url) {
          throw new Error(
            isRtl
              ? `لم يُرجع الخادم رابطًا للصورة "${file.name}"`
              : `The server did not return a URL for "${file.name}"`
          )
        }

        uploadedUrls.push(
          uploaded.url
        )

        setUploadProgress(
          (current) => ({
            ...current,
            percent: 100,
          })
        )

        items.push({
          title:
            collectionPayload.title,

          title_en:
            collectionPayload.title_en,

          image_url:
            uploaded.url,

          thumbnail_url:
            uploaded.url,

          video_url: '',

          sort_order:
            collectionItems.length +
            index +
            1,

          is_active: true,
        })
      }

      return {
        items,

        uploadedUrls,

        coverUrl:
          items[0]?.image_url ||
          currentCoverUrl ||
          '',
      }
    }

  const uploadVideoItems =
    async (
      collectionPayload,
      signal
    ) => {
      const directItems =
        videoUrls
          .map((url) =>
            url.trim()
          )
          .filter(Boolean)
          .map(
            (
              url,
              index
            ) => ({
              title:
                collectionPayload.title,

              title_en:
                collectionPayload.title_en,

              image_url: '',
              thumbnail_url: '',

              video_url: url,

              sort_order:
                collectionItems.length +
                index +
                1,

              is_active: true,
            })
          )

      const uploadedItems = []
      const uploadedUrls = []

      if (
        videoFiles.length > 0 &&
        typeof api
          .uploadSignedMedia !==
          'function'
      ) {
        throw new Error(
          isRtl
            ? 'وظيفة رفع الفيديو الكبير غير مضافة داخل api.js'
            : 'The large-video upload function is missing from api.js'
        )
      }

      for (
        let index = 0;
        index <
        videoFiles.length;
        index += 1
      ) {
        const originalFile =
          videoFiles[index]

        const file =
          normalizeVideoFile(
            originalFile
          )

        setUploadProgress({
          active: true,
          stage: 'uploading',
          fileName:
            file.name,
          current:
            index + 1,
          total:
            videoFiles.length,
          percent: 0,
        })

        const uploaded =
          await api.uploadSignedMedia(
            file,
            'gallery/videos',
            {
              globalLoading:
                false,

              timeoutMs:
                VIDEO_UPLOAD_TIMEOUT,

              signal,

              onProgress: ({
                percent,
              }) => {
                setUploadProgress(
                  (current) => ({
                    ...current,
                    percent,
                  })
                )
              },
            }
          )

        if (!uploaded?.url) {
          throw new Error(
            isRtl
              ? `لم يُرجع الخادم رابطًا للفيديو "${file.name}"`
              : `The server did not return a URL for "${file.name}"`
          )
        }

        uploadedUrls.push(
          uploaded.url
        )

        uploadedItems.push({
          title:
            collectionPayload.title,

          title_en:
            collectionPayload.title_en,

          image_url: '',
          thumbnail_url: '',

          video_url:
            uploaded.url,

          sort_order:
            collectionItems.length +
            directItems.length +
            index +
            1,

          is_active: true,
        })
      }

      const coverUrl =
        uploadedItems[0]
          ?.video_url ||
        directItems[0]
          ?.video_url ||
        currentCoverUrl ||
        ''

      return {
        items: [
          ...directItems,
          ...uploadedItems,
        ],

        uploadedUrls,

        coverUrl,
      }
    }

  const uploadNewItems =
    async (
      collectionPayload,
      signal
    ) => {
      if (
        collectionPayload.type ===
        'photo'
      ) {
        return uploadPhotoItems(
          collectionPayload,
          signal
        )
      }

      return uploadVideoItems(
        collectionPayload,
        signal
      )
    }

  const handleSave =
    async () => {
      setTouched({
        title: true,
        title_en: true,
        sort_order: true,
        media: true,
        video_urls: true,
      })

      if (saving) {
        return
      }

      const currentErrors =
        validateForm(
          form,
          {
            isRtl,
            editCollectionId,
            photoFiles,
            videoFiles,
            videoUrls,
          }
        )

      if (
        Object.keys(
          currentErrors
        ).length > 0
      ) {
        const firstError =
          Object.values(
            currentErrors
          )[0]

        toast.error(
          firstError,
          toastTheme.error
        )

        return
      }

      const controller =
        new AbortController()

      uploadAbortRef.current =
        controller

      setSaving(true)

      let uploadedUrls = []
      let dataPersisted = false

      try {
        const initialPayload =
          buildCollectionPayload()

        const uploadResult =
          await uploadNewItems(
            initialPayload,
            controller.signal
          )

        uploadedUrls =
          uploadResult
            .uploadedUrls || []

        const collectionPayload =
          buildCollectionPayload(
            uploadResult.coverUrl
          )

        setCurrentCoverUrl(
          collectionPayload.cover_url
        )

        setUploadProgress({
          active: true,
          stage: 'saving',
          fileName: '',
          current:
            uploadProgress.total ||
            1,
          total:
            uploadProgress.total ||
            1,
          percent: 100,
        })

        if (editCollectionId) {
          await api.put(
            `/gallery/collections/${editCollectionId}`,
            collectionPayload,
            {
              globalLoading:
                false,

              signal:
                controller.signal,
            }
          )

          if (
            uploadResult
              .items.length > 0
          ) {
            await api.post(
              `/gallery/collections/${editCollectionId}/items`,
              {
                items:
                  uploadResult.items,
              },
              {
                globalLoading:
                  false,

                signal:
                  controller.signal,
              }
            )
          }
        } else {
          await api.post(
            '/gallery/collections',
            {
              collection:
                collectionPayload,

              items:
                uploadResult.items,
            },
            {
              globalLoading:
                false,

              signal:
                controller.signal,
            }
          )
        }

        dataPersisted = true

        toast.success(
          editCollectionId
            ? isRtl
              ? 'تم تحديث المجموعة وملفاتها بنجاح'
              : 'The collection and its files were updated successfully'
            : isRtl
              ? 'تم حفظ المجموعة وملفاتها بنجاح'
              : 'The collection and its files were saved successfully',
          toastTheme.success
        )

        setModalOpen(false)
        resetModalState()

        await load()
      } catch (error) {
        console.error(
          'Save gallery collection failed:',
          error
        )

        if (
          !dataPersisted &&
          uploadedUrls.length >
            0
        ) {
          await rollbackUploadedFiles(
            uploadedUrls
          )
        }

        toast.error(
          normalizeErrorMessage(
            error,
            isRtl
          ),
          toastTheme.error
        )
      } finally {
        uploadAbortRef.current =
          null

        setSaving(false)

        setUploadProgress(
          EMPTY_UPLOAD_PROGRESS
        )
      }
    }

  const handleDeleteCollection =
    async (collection) => {
      const confirmed =
        await requestConfirm({
          title: isRtl
            ? 'تأكيد حذف المجموعة'
            : 'Delete collection?',

          message: isRtl
            ? 'سيتم حذف المجموعة وجميع الصور أو الفيديوهات التابعة لها نهائيًا.'
            : 'The collection and all of its media will be permanently removed.',

          variant: 'danger',

          confirmText:
            t.delete,
        })

      if (!confirmed) {
        return
      }

      try {
        await api.delete(
          `/gallery/collections/${collection.id}`,
          null,
          {
            globalLoading:
              false,
          }
        )

        toast.success(
          isRtl
            ? 'تم حذف المجموعة بنجاح'
            : 'Collection deleted successfully',
          toastTheme.success
        )

        await load()
      } catch (error) {
        toast.error(
          normalizeErrorMessage(
            error,
            isRtl
          ),
          toastTheme.error
        )
      }
    }

  const handleDeleteItem =
    async (item) => {
      const confirmed =
        await requestConfirm({
          title: isRtl
            ? 'حذف العنصر؟'
            : 'Delete item?',

          message: isRtl
            ? 'سيتم حذف هذا العنصر من المجموعة نهائيًا.'
            : 'This item will be permanently removed from the collection.',

          variant: 'danger',

          confirmText:
            t.delete,
        })

      if (!confirmed) {
        return
      }

      try {
        await api.delete(
          `/gallery/items/${item.id}`,
          null,
          {
            globalLoading:
              false,
          }
        )

        const remainingItems =
          collectionItems.filter(
            (currentItem) =>
              currentItem.id !==
              item.id
          )

        setCollectionItems(
          remainingItems
        )

        const deletedMediaUrl =
          getItemMediaUrl(item)

        if (
          deletedMediaUrl &&
          deletedMediaUrl ===
            currentCoverUrl
        ) {
          const nextCoverUrl =
            getItemMediaUrl(
              remainingItems[0]
            )

          setCurrentCoverUrl(
            nextCoverUrl
          )

          if (editCollectionId) {
            await api.put(
              `/gallery/collections/${editCollectionId}`,
              buildCollectionPayload(
                nextCoverUrl
              ),
              {
                globalLoading:
                  false,
              }
            )
          }
        }

        toast.success(
          isRtl
            ? 'تم حذف العنصر بنجاح'
            : 'Item deleted successfully',
          toastTheme.success
        )

        await load()
      } catch (error) {
        toast.error(
          normalizeErrorMessage(
            error,
            isRtl
          ),
          toastTheme.error
        )
      }
    }

  const getTitle = (item) => {
    if (isRtl) {
      return (
        item.title ||
        item.title_en ||
        '—'
      )
    }

    return (
      item.title_en ||
      item.title ||
      '—'
    )
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
              ? 'إدارة مجموعات الصور والفيديوهات، مع اختيار أول ملف مرفوع غلافًا للمجموعة تلقائيًا.'
              : 'Manage photo and video collections. The first uploaded file is automatically used as the collection cover.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              openAddCollection(
                'photo'
              )
            }
            className="btn-primary justify-center"
          >
            <ImageIcon
              size={17}
            />

            {isRtl
              ? 'إضافة مجموعة صور'
              : 'Add Photo Collection'}
          </button>

          <button
            type="button"
            onClick={() =>
              openAddCollection(
                'video'
              )
            }
            className="btn-primary justify-center"
          >
            <Video size={17} />

            {isRtl
              ? 'إضافة مجموعة فيديوهات'
              : 'Add Video Collection'}
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterButton
          active={
            filter === 'all'
          }
          onClick={() =>
            setFilter('all')
          }
          label={`${
            isRtl
              ? 'الكل'
              : 'All'
          } (${collections.length})`}
        />

        <FilterButton
          active={
            filter === 'photo'
          }
          onClick={() =>
            setFilter('photo')
          }
          label={`${
            isRtl
              ? 'الصور'
              : 'Photos'
          } (${photosCount})`}
        />

        <FilterButton
          active={
            filter === 'video'
          }
          onClick={() =>
            setFilter('video')
          }
          label={`${
            isRtl
              ? 'الفيديوهات'
              : 'Videos'
          } (${videosCount})`}
        />
      </div>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-gray-100 bg-white text-sm font-medium text-gray-400 shadow-sm">
          <Loader2
            size={20}
            className="me-2 animate-spin"
          />

          {isRtl
            ? 'جارٍ تحميل المجموعات...'
            : 'Loading collections...'}
        </div>
      ) : filteredCollections.length ===
        0 ? (
        <EmptyState
          text={
            isRtl
              ? 'لا توجد مجموعات'
              : 'No collections found'
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCollections.map(
            (collection) => (
              <article
                key={
                  collection.id
                }
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CollectionCover
                  collection={
                    collection
                  }
                  isRtl={isRtl}
                />

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-2 font-bold text-dark">
                        {getTitle(
                          collection
                        )}
                      </h2>

                      <p className="mt-1 text-xs text-gray-400">
                        {collection.type ===
                        'photo'
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
                        isActive(
                          collection.is_active
                        )
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isActive(
                        collection.is_active
                      )
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
                        {toNumber(
                          collection.items_count
                        )}
                      </div>

                      <div className="mt-1 text-gray-400">
                        {isRtl
                          ? 'عنصر'
                          : 'Items'}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-dark">
                        {toNumber(
                          collection.events_count
                        )}
                      </div>

                      <div className="mt-1 text-gray-400">
                        {isRtl
                          ? 'فعالية'
                          : 'Events'}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-dark">
                        {collection.sort_order ||
                          0}
                      </div>

                      <div className="mt-1 text-gray-400">
                        {isRtl
                          ? 'الترتيب'
                          : 'Order'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEditCollection(
                          collection
                        )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-50 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                    >
                      <Edit size={16} />
                      {t.edit}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteCollection(
                          collection
                        )
                      }
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-50 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2
                        size={16}
                      />

                      {t.delete}
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}

      <AdminModal
        open={modalOpen}
        title={
          editCollectionId
            ? isRtl
              ? 'تعديل المجموعة'
              : 'Edit Collection'
            : form.type ===
                'photo'
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
              ? 'يمكنك إضافة روابط فيديو مباشرة أو رفع ملفات فيديو من جهازك. سيصبح أول فيديو غلافًا للمجموعة.'
              : 'Add direct video links or upload video files from your device. The first video becomes the collection cover.'
            : isRtl
              ? `يمكن رفع حتى ${MAX_IMAGES} صورة، وستصبح أول صورة غلافًا للمجموعة.`
              : `Upload up to ${MAX_IMAGES} images. The first image becomes the collection cover.`
        }
        icon={
          form.type === 'video'
            ? Film
            : ImageIcon
        }
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
              disabled={saving}
              className="btn-primary justify-center"
            >
              {saving ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}

              {saving
                ? t.saving
                : t.save}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {uploadProgress.active && (
            <UploadProgressPanel
              progress={
                uploadProgress
              }
              isRtl={isRtl}
              onCancel={
                cancelUpload
              }
            />
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ValidatedField
              label={
                isRtl
                  ? 'عنوان المجموعة بالعربي'
                  : 'Arabic Title'
              }
              value={form.title}
              onChange={(value) =>
                updateForm(
                  'title',
                  value
                )
              }
              onBlur={() =>
                markTouched(
                  'title'
                )
              }
              error={errors.title}
              touched={
                touched.title
              }
              required
              dir="rtl"
              disabled={saving}
            />

            <ValidatedField
              label={
                isRtl
                  ? 'عنوان المجموعة بالإنجليزي'
                  : 'English Title'
              }
              value={
                form.title_en
              }
              onChange={(value) =>
                updateForm(
                  'title_en',
                  value
                )
              }
              onBlur={() =>
                markTouched(
                  'title_en'
                )
              }
              error={
                errors.title_en
              }
              touched={
                touched.title_en
              }
              dir="ltr"
              disabled={saving}
            />

            <ValidatedField
              label={
                isRtl
                  ? 'نوع المجموعة'
                  : 'Collection Type'
              }
              value={form.type}
              onChange={(value) =>
                updateForm(
                  'type',
                  value
                )
              }
              touched
              disabled={
                Boolean(
                  editCollectionId
                ) || saving
              }
              as="select"
              options={[
                {
                  value: 'photo',

                  label:
                    isRtl
                      ? 'مجموعة صور'
                      : 'Photo Collection',
                },

                {
                  value: 'video',

                  label:
                    isRtl
                      ? 'مجموعة فيديوهات'
                      : 'Video Collection',
                },
              ]}
            />

            <ValidatedField
              label={
                isRtl
                  ? 'الترتيب'
                  : 'Sort Order'
              }
              value={
                form.sort_order
              }
              onChange={(value) =>
                updateForm(
                  'sort_order',
                  value
                )
              }
              onBlur={() =>
                markTouched(
                  'sort_order'
                )
              }
              error={
                errors.sort_order
              }
              touched={
                touched.sort_order
              }
              type="number"
              min="0"
              dir="ltr"
              disabled={saving}
            />
          </div>

          {form.type ===
          'photo' ? (
            <MediaPicker
              label={
                editCollectionId
                  ? isRtl
                    ? 'إضافة صور جديدة من الجهاز (اختياري)'
                    : 'Upload New Images from Device (Optional)'
                  : isRtl
                    ? 'رفع صور المجموعة من الجهاز'
                    : 'Upload Collection Images from Device'
              }
              accept="image/*"
              files={photoFiles}
              onChange={
                handlePhotoFiles
              }
              onRemove={
                removePhotoFile
              }
              icon={ImageIcon}
              error={errors.media}
              touched={
                touched.media
              }
              isRtl={isRtl}
              disabled={saving}
              hint={
                isRtl
                  ? `حتى ${MAX_IMAGES} صورة، وحجم كل صورة لا يتجاوز 10MB`
                  : `Up to ${MAX_IMAGES} images, no larger than 10MB each`
              }
            />
          ) : (
            <div className="space-y-5">
              <MediaPicker
                label={
                  editCollectionId
                    ? isRtl
                      ? 'رفع فيديوهات جديدة من الجهاز (اختياري)'
                      : 'Upload New Videos from Device (Optional)'
                    : isRtl
                      ? 'رفع ملفات فيديو من الجهاز'
                      : 'Upload Video Files from Device'
                }
                accept="video/*,.mkv"
                files={videoFiles}
                onChange={
                  handleVideoFiles
                }
                onRemove={
                  removeVideoFile
                }
                icon={UploadCloud}
                error={errors.media}
                touched={
                  touched.media
                }
                isRtl={isRtl}
                disabled={saving}
                hint={
                  isRtl
                    ? `حتى ${MAX_VIDEO_FILES} فيديوهات، وحجم كل فيديو لا يتجاوز 250MB`
                    : `Up to ${MAX_VIDEO_FILES} videos, no larger than 250MB each`
                }
              />

              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-dark">
                      {isRtl
                        ? 'روابط الفيديو المباشرة'
                        : 'Direct Video Links'}
                    </h3>

                    <p className="mt-1 text-xs text-gray-400">
                      {isRtl
                        ? 'يمكن إضافة رابط يوتيوب أو فيميو أو رابط ملف فيديو مباشر.'
                        : 'Add a YouTube, Vimeo, or direct video file URL.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addVideoUrl}
                    disabled={saving}
                    className="inline-flex h-9 items-center gap-1 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={14} />

                    {isRtl
                      ? 'إضافة رابط'
                      : 'Add Link'}
                  </button>
                </div>

                <div className="space-y-2">
                  {videoUrls.map(
                    (url, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2"
                      >
                        <div className="relative min-w-0 flex-1">
                          <LinkIcon
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />

                          <input
                            type="url"
                            value={url}
                            disabled={saving}
                            onChange={(
                              event
                            ) =>
                              updateVideoUrl(
                                index,
                                event.target
                                  .value
                              )
                            }
                            onBlur={() =>
                              markTouched(
                                'video_urls'
                              )
                            }
                            className={`input-field pl-10 ${
                              touched.video_urls &&
                              url &&
                              !isValidHttpUrl(
                                url
                              )
                                ? 'border-red-400 ring-4 ring-red-50'
                                : ''
                            }`}
                            dir="ltr"
                            placeholder="https://youtube.com/watch?v=..."
                          />
                        </div>

                        {videoUrls.length >
                          1 && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                              removeVideoUrl(
                                index
                              )
                            }
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={
                              isRtl
                                ? 'حذف الرابط'
                                : 'Remove URL'
                            }
                          >
                            <Trash2
                              size={17}
                            />
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>

                {touched.video_urls &&
                  errors.video_urls && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {
                        errors.video_urls
                      }
                    </p>
                  )}
              </div>
            </div>
          )}

          {editCollectionId &&
            collectionItems.length >
              0 && (
              <div>
                <h3 className="mb-3 text-sm font-bold text-dark">
                  {isRtl
                    ? 'العناصر الحالية'
                    : 'Current Items'}
                </h3>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {collectionItems.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                      >
                        <ItemThumb
                          item={item}
                          type={form.type}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-xs font-semibold text-gray-700">
                            {item.title ||
                              form.title}
                          </p>

                          <p className="mt-1 text-[11px] text-gray-400">
                            {form.type ===
                            'photo'
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
                          disabled={saving}
                          onClick={() =>
                            handleDeleteItem(
                              item
                            )
                          }
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={
                            isRtl
                              ? 'حذف العنصر'
                              : 'Delete item'
                          }
                        >
                          <Trash2
                            size={14}
                          />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <input
              type="checkbox"
              checked={Boolean(
                form.is_active
              )}
              disabled={saving}
              onChange={(event) =>
                updateForm(
                  'is_active',
                  event.target
                    .checked
                )
              }
              className="h-4 w-4 accent-primary"
            />

            <span className="text-sm font-semibold text-gray-700">
              {isRtl
                ? 'إظهار المجموعة في الموقع'
                : 'Show collection on website'}
            </span>
          </label>
        </div>
      </AdminModal>
    </div>
  )
}

function UploadProgressPanel({
  progress,
  isRtl,
  onCancel,
}) {
  const isSaving =
    progress.stage ===
    'saving'

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Loader2
              size={17}
              className="shrink-0 animate-spin text-primary"
            />

            <p className="text-sm font-bold text-dark">
              {isSaving
                ? isRtl
                  ? 'جارٍ حفظ بيانات المجموعة...'
                  : 'Saving collection data...'
                : isRtl
                  ? 'جارٍ رفع الملف...'
                  : 'Uploading file...'}
            </p>
          </div>

          {!isSaving &&
            progress.fileName && (
              <p
                className="mt-1 truncate text-xs text-gray-500"
                dir="ltr"
              >
                {progress.fileName}
              </p>
            )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold text-primary">
            {progress.percent}%
          </span>

          {!isSaving && (
            <button
              type="button"
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
              aria-label={
                isRtl
                  ? 'إلغاء الرفع'
                  : 'Cancel upload'
              }
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{
            width:
              `${progress.percent}%`,
          }}
        />
      </div>

      {!isSaving &&
        progress.total > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            {isRtl
              ? `الملف ${progress.current} من ${progress.total}`
              : `File ${progress.current} of ${progress.total}`}
          </p>
        )}
    </div>
  )
}

function MediaPicker({
  label,
  accept,
  files,
  onChange,
  onRemove,
  icon: Icon,
  error,
  touched,
  isRtl,
  hint,
  disabled,
}) {
  const reactId = useId()

  const inputId =
    `gallery-media-${reactId}`

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
        disabled={disabled}
        onChange={onChange}
        className="hidden"
      />

      <label
        htmlFor={inputId}
        className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60'
            : touched && error
              ? 'cursor-pointer border-red-300 bg-red-50/50'
              : 'cursor-pointer border-primary/25 bg-primary/5 hover:border-primary/50 hover:bg-primary/10'
        }`}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-primary/10 transition group-hover:scale-105">
          <Icon size={23} />
        </div>

        <p className="text-sm font-bold text-dark">
          {isRtl
            ? 'اضغط لاختيار الملفات من جهازك'
            : 'Click to choose files from your device'}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {hint}
        </p>
      </label>

      {touched && error && (
        <p className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files
            .slice(0, 10)
            .map(
              (file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon size={16} />
                  </div>

                  <div
                    className="min-w-0 flex-1"
                    dir="ltr"
                  >
                    <p className="truncate text-xs font-semibold text-gray-700">
                      {file.name}
                    </p>

                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {formatFileSize(
                        file.size
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      onRemove(index)
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={
                      isRtl
                        ? 'إزالة الملف'
                        : 'Remove file'
                    }
                  >
                    <X size={15} />
                  </button>
                </div>
              )
            )}

          {files.length > 10 && (
            <p className="text-xs font-medium text-gray-500">
              {isRtl
                ? `بالإضافة إلى ${files.length - 10} ملفات أخرى`
                : `Plus ${files.length - 10} more files`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function CollectionCover({
  collection,
  isRtl,
}) {
  const [failed, setFailed] =
    useState(false)

  const coverUrl =
    resolveCollectionMediaUrl(
      collection.cover_url
    )

  const isPhoto =
    collection.type ===
    'photo'

  if (
    coverUrl &&
    !failed &&
    isPhoto
  ) {
    return (
      <img
        src={coverUrl}
        alt=""
        loading="lazy"
        onError={() =>
          setFailed(true)
        }
        className="aspect-[16/8] w-full bg-gray-100 object-cover"
      />
    )
  }

  if (
    coverUrl &&
    !failed &&
    !isPhoto &&
    isDirectPlayableVideoUrl(
      coverUrl
    )
  ) {
    return (
      <div className="relative aspect-[16/8] overflow-hidden bg-black">
        <video
          src={coverUrl}
          muted
          playsInline
          preload="metadata"
          onError={() =>
            setFailed(true)
          }
          className="h-full w-full object-cover"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg">
            <Video size={27} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[112px] items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-white">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-sm ring-1 ring-primary/10">
          {isPhoto ? (
            <ImageIcon
              size={27}
            />
          ) : (
            <Video size={27} />
          )}
        </div>

        <p className="mt-2 text-xs font-semibold text-primary/80">
          {isPhoto
            ? isRtl
              ? 'مجموعة صور'
              : 'Photo Collection'
            : isRtl
              ? 'مجموعة فيديوهات'
              : 'Video Collection'}
        </p>
      </div>
    </div>
  )
}

function ItemThumb({
  item,
  type,
}) {
  if (type === 'photo') {
    const image =
      item.thumbnail_url ||
      item.image_url

    if (image) {
      return (
        <img
          src={resolveCollectionMediaUrl(
            image
          )}
          alt=""
          loading="lazy"
          className="h-12 w-12 shrink-0 rounded-lg object-cover"
        />
      )
    }
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {type === 'video' ? (
        <Video size={18} />
      ) : (
        <ImageIcon
          size={18}
        />
      )}
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  label,
}) {
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

function EmptyState({
  text,
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-gray-400 shadow-sm">
      {text}
    </div>
  )
}
