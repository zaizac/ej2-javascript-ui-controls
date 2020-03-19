/**
 * Spreadsheet default sample
 */
import { Spreadsheet, SheetModel, ColumnModel } from './../../../../src/index';
import { enableRipple } from '@syncfusion/ej2-base';
import { switchTheme } from '../../../common/switch-theme';
import { defaultData as dataSource } from './../../../common/data-source';
import './../../../../node_modules/es6-promise/dist/es6-promise';

enableRipple(true);

let wrapper: HTMLElement = document.getElementById('wrapper');

wrapper.style.height = `${document.documentElement.clientHeight - 70}px`;

let columns: ColumnModel[] = [
    {
        width: 130
    },
    {
        width: 92
    },
    {
        width: 96
    }
];

let sheet: SheetModel[] = [{
    name: 'Price Details',
    rangeSettings: [{
        dataSource: dataSource,
        startCell: 'A1'
    }],
    rowCount: 200,
    columns: columns,

},{
    name: 'Price Details',
    rangeSettings: [{
        dataSource: dataSource,
        startCell: 'A1'
    }]

}];
let spreadsheet: Spreadsheet = new Spreadsheet({
    sheets: sheet
    
});

spreadsheet.appendTo('#spreadsheet');
    spreadsheet.protectSheet({selectCells: true, formatRows: true});
switchTheme('#select-theme', spreadsheet);