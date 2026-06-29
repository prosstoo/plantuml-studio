import type { ReactZoomPanPinchProps } from 'react-zoom-pan-pinch'

export const ZOOM_ANIMATION_MS = 300
export const ZOOM_ANIMATION_EASING = 'easeOutCubic' as const
/** Шаг для кнопок + / − */
export const ZOOM_BUTTON_STEP = 0.22

export const DIAGRAM_ZOOM_PROPS = {
  smooth: true,
  minScale: 0.1,
  maxScale: 5,
  centerOnInit: true,
  limitToBounds: false,
  wheel: {
    step: 0.012,
  },
  pinch: {
    step: 2.5,
  },
  doubleClick: {
    mode: 'toggle' as const,
    step: 1.4,
    animationTime: ZOOM_ANIMATION_MS,
    animationType: ZOOM_ANIMATION_EASING,
  },
  zoomAnimation: {
    disabled: false,
    size: 0.35,
    animationTime: ZOOM_ANIMATION_MS,
    animationType: ZOOM_ANIMATION_EASING,
  },
  velocityAnimation: {
    disabled: false,
    sensitivityTouch: 1.1,
    sensitivityMouse: 1,
    animationTime: ZOOM_ANIMATION_MS,
    maxAnimationTime: 450,
    animationType: ZOOM_ANIMATION_EASING,
  },
  panning: {
    velocityDisabled: false,
  },
} satisfies Partial<ReactZoomPanPinchProps>
