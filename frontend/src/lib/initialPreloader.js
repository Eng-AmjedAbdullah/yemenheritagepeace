export function removeInitialPreloader() {
  const element = document.getElementById('initial-app-preloader')

  if (!element) return

  if (element.classList.contains('initial-app-preloader--leaving')) {
    return
  }

  element.classList.add('initial-app-preloader--leaving')

  const remove = () => {
    if (element.parentElement) {
      element.parentElement.removeChild(element)
    }
  }

  element.addEventListener('transitionend', remove, { once: true })
  window.setTimeout(remove, 400)
}
