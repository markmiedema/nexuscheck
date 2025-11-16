declare module 'react-simple-maps' {
  import { ComponentType } from 'react'

  export interface GeographyProps {
    geography: any
    [key: string]: any
  }

  export interface GeographiesProps {
    children: (props: { geographies: any[] }) => React.ReactNode
    [key: string]: any
  }

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: any
    width?: number
    height?: number
    children?: React.ReactNode
    [key: string]: any
  }

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    children?: React.ReactNode
    [key: string]: any
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>
}
