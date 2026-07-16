// src/types/react-leaflet.d.ts
declare module 'react-leaflet' {
  import { Component, ReactNode, RefObject } from 'react';
  import { Map as LeafletMap, TileLayer as LeafletTileLayer, Marker as LeafletMarker, MapOptions } from 'leaflet';

  export interface MapContainerProps extends MapOptions {
    center: [number, number];
    zoom: number;
    children?: ReactNode;
    style?: React.CSSProperties;
    className?: string;
  }

  export class MapContainer extends Component<MapContainerProps> {
    getMap(): LeafletMap;
  }

  export interface TileLayerProps {
    attribution: string;
    url: string;
  }

  export class TileLayer extends Component<TileLayerProps> {}

  export interface MarkerProps {
    position: [number, number];
    draggable?: boolean;
    eventHandlers?: {
      dragend?: (event: L.LeafletEvent) => void;
    };
  }

  export class Marker extends Component<MarkerProps> {}

  export function useMapEvents(events: {
    click?: (e: L.LeafletMouseEvent) => void;
    [key: string]: any;
  }): void;

  export function useMap(): LeafletMap;
}