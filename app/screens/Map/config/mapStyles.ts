import { colors } from '@/theme'

export const MAP_STYLES = {
  marker: {
    circleRadius: 8,
    circleColor: colors.palette.primary400,
    circleStrokeWidth: 2,
    circleStrokeColor: '#ffffff',
  },
  temporaryMarker: {
    circleRadius: 8,
    circleColor: colors.palette.accent300,
    circleStrokeWidth: 2,
    circleStrokeColor: '#ffffff',
  },
  buildings: {
    fillExtrusionColor: '#fff',
    fillExtrusionOpacity: 0,
    fillExtrusionHeight: 0,
    fillExtrusionBase: 0,
  },
  selectedMarker: {
    circleRadius: 16,
    circleColor: colors.palette.primary400,
    circleStrokeWidth: 2,
    circleStrokeColor: '#ffffff',
    circleOpacity: 0.5,
  },
} as const
