declare module 'react-grid-layout' {
  import * as React from 'react';

  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    moved?: boolean;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }

  export type Layouts = {[key: string]: Layout[]};

  export interface ReactGridLayoutProps {
    className?: string;
    style?: React.CSSProperties;
    width?: number;
    autoSize?: boolean;
    cols?: number;
    draggableCancel?: string;
    draggableHandle?: string;
    verticalCompact?: boolean;
    compactType?: 'vertical' | 'horizontal' | null;
    layout?: Layout[];
    margin?: [number, number];
    containerPadding?: [number, number];
    rowHeight?: number;
    maxRows?: number;
    isDraggable?: boolean;
    isResizable?: boolean;
    preventCollision?: boolean;
    useCSSTransforms?: boolean;
    measureBeforeMount?: boolean;
    resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
    onLayoutChange?: (layout: Layout[], layouts: Layouts) => void;
    onDragStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onDrag?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onDragStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResizeStart?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResize?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    onResizeStop?: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, event: MouseEvent, element: HTMLElement) => void;
    children?: React.ReactNode;
  }

  export interface ResponsiveProps extends ReactGridLayoutProps {
    breakpoints?: {lg?: number, md?: number, sm?: number, xs?: number, xxs?: number};
    cols?: {lg?: number, md?: number, sm?: number, xs?: number, xxs?: number};
    layouts?: Layouts;
    onBreakpointChange?: (breakpoint: string, cols: number) => void;
    onLayoutChange?: (layout: Layout[], layouts: Layouts) => void;
    onWidthChange?: (width: number, margin: [number, number], cols: number, containerPadding: [number, number]) => void;
    children?: React.ReactNode;
  }

  export default class ReactGridLayout extends React.Component<ReactGridLayoutProps> {}
  
  export class Responsive extends React.Component<ResponsiveProps> {
    static defaultProps: {
      breakpoints: {lg: number, md: number, sm: number, xs: number, xxs: number};
      cols: {lg: number, md: number, sm: number, xs: number, xxs: number};
    };
  }
  
  export function WidthProvider<P>(
    ComposedComponent: React.ComponentType<P>
  ): React.ComponentType<Omit<P, 'width'>>;
}