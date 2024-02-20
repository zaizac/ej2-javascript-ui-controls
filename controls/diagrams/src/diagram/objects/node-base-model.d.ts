import { Property, Complex, ChildProperty } from '@syncfusion/ej2-base';import { Margin } from '../core/appearance';import { MarginModel } from '../core/appearance-model';import { DiagramTooltipModel } from './tooltip-model';import { DiagramTooltip } from './tooltip';import { FlipDirection, FlipMode } from '../enum/enum';import { SymbolPaletteInfoModel } from './preview-model';import { SymbolPaletteInfo } from './preview';

/**
 * Interface for a class NodeBase
 */
export interface NodeBaseModel {

    /**
     * Represents the unique id of nodes/connectors
     *
     * @default ''
     */
    id?: string;

    /**
     * Defines the visual order of the node/connector in DOM
     *
     * @default Number.MIN_VALUE
     */
    zIndex?: number;

    /**
     * Defines the space to be left between the node and its immediate parent
     *
     * @default {}
     */
    margin?: MarginModel;

    /**
     * Sets the visibility of the node/connector
     *
     * @default true
     */
    visible?: boolean;

    /**
     * defines the tooltip for the node
     *
     * @default {}
     */
    tooltip?: DiagramTooltipModel;

    /**
     * Defines whether the node should be automatically positioned or not. Applicable, if layout option is enabled.
     *
     * @default false
     */
    excludeFromLayout?: boolean;

    /**
     * Allows the user to save custom information/data about a node/connector
     *
     * @aspDefaultValueIgnore
     * @default undefined
     */
    addInfo?: Object;

    /**
     * Flip the element in Horizontal/Vertical directions
     *
     * @aspDefaultValueIgnore
     * @default None
     */
    flip?: FlipDirection;

    /**
     * Allows you to flip only the node or along with port and label
     *
     * @aspDefaultValueIgnore
     * @default All
     */
    flipMode?: FlipMode;

    /**
     * Defines the symbol info of a connector
     *
     * @aspDefaultValueIgnore
     * @default undefined
     * @ignoreapilink
     */
    symbolInfo?: SymbolPaletteInfoModel;

}