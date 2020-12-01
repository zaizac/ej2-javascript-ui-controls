import { SheetModel } from './index';import { ChildProperty, Property } from '@syncfusion/ej2-base';

/**
 * Interface for a class Column
 */
export interface ColumnModel {

    /**
     * Specifies index of the column. Based on the index, column properties are applied.
     * @default 0
     * @asptype int
     */
    index?: number;

    /**
     * Specifies width of the column.
     * @default 64
     * @asptype int
     */
    width?: number;

    /**
     * specifies custom width of the column.
     * @default false
     */
    customWidth?: boolean;

    /**
     * To hide/show the column in spreadsheet.
     * @default false
     */
    hidden?: boolean;

    /**
     * To lock/unlock the column in the protected sheet.
     * @default null
     */
    isLocked?: boolean;

}