import { SpreadsheetHelper } from '../util/spreadsheethelper.spec';
import { defaultData } from '../util/datasource.spec';
import { ExtendedRowModel, Spreadsheet } from '../../../src/index';
import { SpreadsheetModel } from '../../../src/spreadsheet/index';

describe('Resize ->', () => {
    const helper: SpreadsheetHelper = new SpreadsheetHelper('spreadsheet');
    let model: SpreadsheetModel;

    describe('public method ->', () => {
        beforeAll((done: Function) => {
            helper.initializeSpreadsheet({ sheets: [{ ranges: [{ dataSource: defaultData }], rows: [{ index: 4, height: 100 }, { height: 120 }] }] }, done);
        });
        afterAll(() => {
            helper.invoke('destroy');
        });
        // it('AutoFit', (done: Function) => {
        //     helper.invoke('autoFit', ['A:B']); 
        //     expect(helper.getInstance().sheets[0].columns[0].width).toBe(137);
        //     expect(helper.getInstance().sheets[0].columns[1].width).toBe(72);
        //     expect(getComputedStyle(helper.invoke('getCell', [0,0])).width).toBe('137px');
        //     expect(getComputedStyle(helper.invoke('getCell', [0,1])).width).toBe('72px');

        //     helper.invoke('autoFit', ['5:6']);
        //     expect(helper.getInstance().sheets[0].rows[4].height).toBe(20);
        //     expect(helper.getInstance().sheets[0].rows[5].height).toBe(20);
        //     expect(getComputedStyle(helper.invoke('getCell', [4,0])).height).toBe('20px');
        //     expect(getComputedStyle(helper.invoke('getCell', [5,0])).height).toBe('20px');
        //     helper.getInstance().sheets[0].columns[0].width = 64; // resized column width persist for other test cases
        //     helper.getInstance().sheets[0].columns[1].width = 64;
        //     done();
        // });
        it('Apply autofit on rows and columns which contains wrap cell', (done: Function) => {
            const spreadsheet: Spreadsheet = helper.getInstance();
            spreadsheet.setColWidth(30, 3, 0);
            helper.invoke('updateCell', [{ wrap: true }, 'D2']);
            spreadsheet.autoFit('D');
            expect(spreadsheet.sheets[0].columns[3].width).toBe(58);
            helper.invoke('updateCell', [{ value: 'Text Data Text Data Text Data Text Data Text Data Text Data Text Data' }, 'D2']);
            spreadsheet.setColWidth(228, 3, 0);
            spreadsheet.autoFit('D');
            expect(spreadsheet.sheets[0].columns[3].width).toBe(214);
            expect(spreadsheet.sheets[0].rows[1].height).toBe(256);
            spreadsheet.autoFit('2');
            expect(spreadsheet.sheets[0].rows[1].height).toBe(35);
            spreadsheet.setColWidth(260, 3, 0);
            spreadsheet.autoFit('D');
            expect(spreadsheet.sheets[0].columns[3].width).toBe(245);
            done();
        });
    });
    describe('CR-Issues ->', () => {
        describe('I274109 ->', () => {
            beforeEach((done: Function) => {
                helper.initializeSpreadsheet({
                    sheets: [{ showHeaders: false, rows: [{ cells: [{ value: '100' }, { value: '25' }, { value: '1001' }] }] }]
                }, done);
            });
            afterEach(() => {
                helper.invoke('destroy');
            });
            // it('Setting showHeaders to false to hide the Excel-like headers will generate errors (when setting autofit for cols through method)', (done: Function) => {
            //     helper.invoke('autoFit', ['A:C']);
            //     const spreadsheet: Spreadsheet = helper.getInstance();
            //     const row: HTMLTableRowElement = helper.invoke('getContentTable').rows[0];
            //     expect(spreadsheet.sheets[0].columns[0].width).toBe(27);
            //     expect(row.cells[0].getBoundingClientRect().width).toBe(27);
            //     expect(spreadsheet.sheets[0].columns[1].width).toBe(20);
            //     expect(row.cells[1].getBoundingClientRect().width).toBe(20);
            //     expect(spreadsheet.sheets[0].columns[2].width).toBe(35);
            //     expect(row.cells[2].getBoundingClientRect().width).toBe(35);
            //     helper.getInstance().sheets[0].columns[0].width = 64; // resized column width persist for other test cases
            //     helper.getInstance().sheets[0].columns[1].width = 64;
            //     helper.getInstance().sheets[0].columns[2].width = 64;
            //     done();
            // });
        });

        describe('EJ2-66027 ->', () => {
            beforeEach((done: Function) => {
                helper.initializeSpreadsheet({ enableRtl: true }, done);
            });
            afterEach(() => {
                helper.invoke('destroy');
            });
            it('Issues on spreadsheet when render the component in RTL mode', (done: Function) => {
                let spreadsheet: Spreadsheet = helper.getInstance();
                let activeCell: HTMLElement = helper.getElementFromSpreadsheet('.e-active-cell');
                const autoFill: HTMLElement = helper.getElementFromSpreadsheet('.e-autofill');
                expect(autoFill.style.top).toBe('15px');
                expect(autoFill.style.right).toBe('59px');
                let td: HTMLElement = helper.invoke('getCell', [12, 0]);
                let coords = td.getBoundingClientRect();
                let autoFillCoords = autoFill.getBoundingClientRect();
                helper.triggerMouseAction('mousedown', { x: autoFillCoords.left + 1, y: autoFillCoords.top + 1 }, null, autoFill);
                helper.getInstance().selectionModule.mouseMoveHandler({ target: autoFill, clientX: autoFillCoords.right, clientY: autoFillCoords.bottom });
                helper.getInstance().selectionModule.mouseMoveHandler({ target: td, clientX: coords.left + 1, clientY: coords.top + 1 });
                helper.triggerMouseAction('mouseup', { x: coords.left + 1, y: coords.top + 1 }, document, td);
                expect(autoFill.style.top).toBe('255px');
                expect(autoFill.style.right).toBe('59px');
                helper.invoke('selectRange', ['A1:A1']);
                expect(activeCell.style.width).toBe('64px');
                expect(spreadsheet.sheets[0].columns[0].width).toBeUndefined();
                const colHdrPanel: HTMLElement = helper.invoke('getColumnHeaderContent').parentElement;
                const colHdr: HTMLElement = helper.invoke('getColHeaderTable').rows[0].cells[0];
                const offset: DOMRect = colHdr.getBoundingClientRect() as DOMRect;
                helper.triggerMouseAction('mousemove', { x: offset.left - 1, y: offset.top + 0.5, offsetX: 3 }, colHdrPanel, colHdr);
                helper.triggerMouseAction('mousedown', { x: offset.left, y: offset.top + 1, offsetX: 3 }, colHdrPanel, colHdr);
                helper.triggerMouseAction('mousemove', { x: offset.left - 50, y: offset.top + 1, offsetX: 3 }, spreadsheet.element, colHdr);
                helper.triggerMouseAction('mouseup', { x: offset.left - 50, y: offset.top + 1, offsetX: 3 }, document, colHdr);
                setTimeout((): void => {
                    expect(activeCell.style.width).toBe('114px');
                    expect(spreadsheet.sheets[0].columns[0].width).toBe(114);
                    done();
                }, 50);
            });
        });
    });
    describe('EJ2-56123 ->', () => {
        beforeEach((done: Function) => {
            helper.initializeSpreadsheet({ sheets: [{ ranges: [{ dataSource: defaultData }], columns: [{ width: 150 }, { width: 150 }, { width: 150 }],
                rows: [{ height: 100 }, { height: 120 }, { height: 120 }] }] }, done);
        });
        afterEach(() => {
            helper.invoke('destroy');
        });
        it('Selection misalignment and script error on undo operation after resize the row', (done: Function) => {
            const spreadsheet: Spreadsheet = helper.getInstance();
            spreadsheet.goTo("A60");
            spreadsheet.setRowHeight(20, 0);
            spreadsheet.setRowHeight(20, 1);
            spreadsheet.setRowHeight(20, 2);
            spreadsheet.selectRange("A1");
            let cellEle: HTMLElement = helper.getElements('.e-active-cell')[0];
            let selectionEle: HTMLElement = helper.getElements('.e-selection')[0];
            setTimeout((): void => {
                expect(cellEle.style.height).toEqual(selectionEle.style.height);
                expect(cellEle.style.top).toEqual(selectionEle.style.top);
                done();
            },1000);
        });
    });
    describe('SF-367016, SF-371460 ->', () => {
        let spreadsheet: Spreadsheet;
        beforeAll((done: Function) => {
            helper.initializeSpreadsheet(
                { sheets: [{ ranges: [{ dataSource: defaultData }], columns: [{ width: 150 }, { width: 150 }, { width: 150, hidden: true }],
                frozenColumns: 2, frozenRows: 2 }] }, done);
        });
        afterAll(() => {
            helper.invoke('destroy');
        });
        it('Console error while performing autofit on hidden column which is the first column after the frozen column', (done: Function) => {
            spreadsheet = helper.getInstance();
            const colHdr: HTMLElement = helper.invoke('getCell', [null, 3, helper.invoke('getColHeaderTable').rows[0]]);
            const hdrPanel: HTMLElement = spreadsheet.element.querySelector('.e-header-panel') as HTMLElement;
            const offset: DOMRect = colHdr.getBoundingClientRect() as DOMRect;
            helper.triggerMouseAction('mousemove', { x: offset.left + 0.5, y: offset.top + 1, offsetX: 3 }, hdrPanel, colHdr);
            helper.triggerMouseAction('dblclick', { x: offset.left + 1, y: offset.top + 1, offsetX: 3 }, hdrPanel, colHdr);
            setTimeout((): void => {
                expect(spreadsheet.sheets[0].columns[2].hidden).toBeFalsy();
                done();
            });
        });
        it('Console error while performing autofit on hidden row which is the first row after the frozen row', (done: Function) => {
            helper.invoke(
                'applyFilter', [[{ value: 30, field: 'E', predicate: 'and', operator: 'notequal', type: 'number', matchCase: false,
                ignoreAccent: false }], 'A1:H11']);
            setTimeout((): void => {
                expect(spreadsheet.sheets[0].rows[2].hidden).toBeTruthy();
                expect((spreadsheet.sheets[0].rows[2] as ExtendedRowModel).isFiltered).toBeTruthy();
                const rowHdr: HTMLElement = helper.invoke('getRowHeaderTable').rows[0].cells[0];
                expect(rowHdr.textContent).toBe('4');
                const rowHdrPanel: HTMLElement = helper.invoke('getRowHeaderContent');
                const offset: DOMRect = rowHdr.getBoundingClientRect() as DOMRect;
                helper.triggerMouseAction('mousemove', { x: offset.top + 0.5, y: offset.left + 1, offsetY: 3 }, rowHdrPanel, rowHdr);
                helper.triggerMouseAction('dblclick', { x: offset.top + 1, y: offset.left + 1, offsetY: 3 }, rowHdrPanel, rowHdr);
                setTimeout((): void => {
                    expect(spreadsheet.sheets[0].rows[2].hidden).toBeFalsy();
                    expect((spreadsheet.sheets[0].rows[2] as ExtendedRowModel).isFiltered).toBeTruthy();
                    expect(helper.invoke('getRowHeaderTable').rows[0].cells[0].textContent).toBe('3');
                    expect(helper.invoke('getContentTable').rows[0].getAttribute('aria-rowindex')).toBe('3');
                    done();
                });
            });
        });
    });
    describe('EJ2-54762, EJ2-51216, EJ2-54009->', () => {
        beforeAll((done: Function) => {
            model = {
                sheets: [{ rows: [{ height: 15 }, { height: 10 }, { height: 8 }, { height: 30 }, ], 
                ranges: [{ dataSource: defaultData }] }]
            }
            helper.initializeSpreadsheet(model, done);
        });
        afterAll(() => {
            helper.invoke('destroy');;
        });
        it('EJ2-54762 - While save(json) and load(json) with resize functionalities, row header and cell selection are misaligned->', (done: Function) => {
            expect(helper.getInstance().sheets[0].rows[0].height).toBe(15);
            expect(helper.getInstance().sheets[0].rows[1].height).toBe(10);
            expect(helper.getInstance().sheets[0].rows[2].height).toBe(8);
            expect(helper.getInstance().sheets[0].rows[3].height).toBe(30);
            done();
        });
        it('EJ2-51216 - Underline and strikethrough not working after performing row resize action', (done: Function) => {
            helper.invoke('selectRange', ['B2']);
            helper.edit('B2', 'one two three four five ');
            helper.getElement('#' + helper.id + '_wrap').click();
            helper.invoke('setRowHeight', [80, 1]);
            helper.invoke('setColWidth', [150, 1]);
            helper.invoke('autoFit', ['2']);
            helper.invoke('autoFit', ['B']);
            helper.invoke('selectRange', ['C1']);
            helper.edit('C1', 'One Two');
            helper.invoke('cellFormat', [{ fontSize: '48pt' }, 'C1']);
            helper.invoke('autoFit', ['1']);
            helper.invoke('cellFormat', [{ fontSize: '9pt' }, 'C1']);
            helper.invoke('autoFit', ['1']);
            setTimeout(function () {
                let cellEle: HTMLElement = helper.getElements('.e-active-cell')[0];
                let selectionEle: HTMLElement = helper.getElements('.e-selection')[0];
                expect(cellEle.style.height).toEqual(selectionEle.style.height);
                done();
            });
        });
        it('EJ2-54009 - Cell selection misalignment issue when copy paste and resize the pasted cell.->', (done: Function) => {
            helper.invoke('selectRange', ['D1']);
            helper.invoke('copy', ['D1']);
            setTimeout(() => {
                expect(helper.getElementFromSpreadsheet('.e-copy-indicator')).not.toBeNull();
                helper.invoke('setRowHeight', [80, 0]);
                helper.invoke('setColWidth', [150, 3]);
                setTimeout(() => {
                    expect(helper.getElement().querySelector('.e-copy-indicator').style.height).toBe('80px');
                    expect(helper.getElement().querySelector('.e-copy-indicator').style.width).toBe('151px');
                    done();
                }, 100);
            }, 10);
        });
    });
    describe('EJ2-56260, EJ2-58247->', () => {
        let activeCell: HTMLElement; let spreadsheet: Spreadsheet;
        beforeAll((done: Function) => {
            helper.initializeSpreadsheet({
                sheets: [{ ranges: [{ dataSource: defaultData }] }]
            }, done);
        });
        afterAll(() => {
            helper.invoke('destroy');
        });
        it('Row height issue after performing undo operation->', (done: Function) => {
            spreadsheet = helper.getInstance();
            spreadsheet.setRowHeight(10, 0);
            spreadsheet.selectRange("B1:B200");
            helper.getElement('#' + helper.id + '_cut').click();
            setTimeout(() => {
                spreadsheet.insertColumn(2);
                setTimeout(() => {
                    spreadsheet.selectRange("C1");
                    helper.getElement('#' + helper.id + '_paste').click();
                    helper.getElement('#' + helper.id + '_undo').click();
                    setTimeout(() => {
                        expect(helper.getInstance().sheets[0].rows[0].height).toBe(10);
                        done();
                    });
                });
            });
        });
        it('Merged cell selection misalignment on row resize', (done: Function) => {
            helper.invoke('selectRange', ['C7:D8']);
            helper.invoke('merge');
            setTimeout((): void => {
                activeCell = helper.getElementFromSpreadsheet('.e-active-cell');
                expect(activeCell.style.height).toBe('41px');
                expect(spreadsheet.sheets[0].rows[6].height).toBeUndefined();
                const rowHdrPanel: HTMLElement = helper.invoke('getRowHeaderContent');
                const rowHdr: HTMLElement = helper.invoke('getRowHeaderTable').rows[7].cells[0];
                const offset: DOMRect = rowHdr.getBoundingClientRect() as DOMRect;
                helper.triggerMouseAction('mousemove', { x: offset.top + 0.5, y: offset.left + 1, offsetY: 3 }, rowHdrPanel, rowHdr);
                helper.triggerMouseAction('mousedown', { x: offset.left + 1, y: offset.top + 0.5, offsetY: 3 }, rowHdrPanel, rowHdr);
                helper.triggerMouseAction('mousemove', { x: offset.left + 1, y: offset.top + 50, offsetY: 3 }, spreadsheet.element, rowHdr);
                helper.triggerMouseAction('mouseup', { x: offset.left + 1, y: offset.top + 50, offsetY: 3 }, document, rowHdr);
                setTimeout((): void => {
                    expect(activeCell.style.height).toBe('90px');
                    expect(spreadsheet.sheets[0].rows[6].height).toBe(69);
                    done();
                });
            }, 50);
        });
        it('Merged cell selection misalignment on column resize', (done: Function) => {
            expect(activeCell.style.width).toBe('129px');
            expect(spreadsheet.sheets[0].columns[2].width).toBeUndefined();
            const colHdrPanel: HTMLElement = helper.invoke('getColumnHeaderContent').parentElement;
            const colHdr: HTMLElement = helper.invoke('getColHeaderTable').rows[0].cells[3];
            const offset: DOMRect = colHdr.getBoundingClientRect() as DOMRect;
            helper.triggerMouseAction('mousemove', { x: offset.left + 1, y: offset.top + 0.5, offsetX: 3 }, colHdrPanel, colHdr);
            helper.triggerMouseAction('mousedown', { x: offset.left, y: offset.top + 1, offsetX: 3 }, colHdrPanel, colHdr);
            helper.triggerMouseAction('mousemove', { x: offset.left + 50, y: offset.top + 1, offsetX: 3 }, spreadsheet.element, colHdr);
            helper.triggerMouseAction('mouseup', { x: offset.left + 50, y: offset.top + 1, offsetX: 3 }, document, colHdr);
            setTimeout((): void => {
                expect(activeCell.style.width).toBe('179px');
                expect(spreadsheet.sheets[0].columns[2].width).toBe(114);
                done();
            }, 50);
        });
        it('Merged cell other than active cell row / col resize', (done: Function) => {
            expect(spreadsheet.sheets[0].columns[3]).toBeUndefined();
            helper.invoke('setColWidth', [100, 3]);
            expect(spreadsheet.sheets[0].columns[3].width).toBe(100);
            setTimeout((): void => {
                expect(activeCell.style.width).toBe('215px');
                expect(spreadsheet.sheets[0].rows[7].height).toBeUndefined();
                helper.invoke('setRowHeight', [60, 7]);
                expect(spreadsheet.sheets[0].rows[7].height).toBe(60);
                setTimeout((): void => {
                    expect(activeCell.style.height).toBe('130px');
                    done();
                }, 50);
            }, 50);
        });
    });
    describe('EJ2-60189 ->', () => {
        beforeEach((done: Function) => {
            helper.initializeSpreadsheet({ sheets: [{ ranges: [{ dataSource: defaultData }] }],
                created: (): void => {
                    const spreadsheet: Spreadsheet = helper.getInstance();
                    spreadsheet.hideColumn(1);
                }
            }, done);
        });
        afterEach(() => {
            helper.invoke('destroy');
        });
        it('Selection misalignment occurs while performing autofit when the column is hidden', (done: Function) => {
            const spreadsheet: Spreadsheet = helper.getInstance();
            spreadsheet.autoFit("A:C");
            let cellEle: HTMLElement = helper.getElements('.e-active-cell')[0];
            let selectionEle: HTMLElement = helper.getElements('.e-selection')[0];
            setTimeout((): void => {
                expect(cellEle.style.width).toEqual(selectionEle.style.width);
                expect(cellEle.style.left).toEqual(selectionEle.style.left);
                done();
            });
        });
    });
    describe('EJ2-61757 ->', () => {
        beforeAll((done: Function) => {
            helper.initializeSpreadsheet({ sheets: [{ ranges: [{ dataSource: defaultData }] }],
                created: (): void => {
                    const spreadsheet: Spreadsheet = helper.getInstance();
                    spreadsheet.hideRow(2,4);
                }
            }, done);
        });
        afterAll(() => {
            helper.invoke('destroy');
        });
        it('Console Error on un hiding rows with outside selected range', (done: Function) => {
            helper.invoke('selectRange', ['B1:B200']);
            setTimeout((): void => {
                const spreadsheet: Spreadsheet = helper.getInstance();
                expect(spreadsheet.sheets[0].rows[2].hidden).toBeTruthy();
                expect(spreadsheet.sheets[0].rows[3].hidden).toBeTruthy();
                expect(spreadsheet.sheets[0].rows[4].hidden).toBeTruthy();
                const rowHdr: HTMLElement = helper.invoke('getRowHeaderTable').rows[2].cells[0];
                expect(rowHdr.textContent).toBe('6');
                const rowHdrPanel: HTMLElement = helper.invoke('getRowHeaderContent');
                const offset: DOMRect = rowHdr.getBoundingClientRect() as DOMRect;
                helper.triggerMouseAction('mousemove', { x: offset.top + 0.5, y: offset.left + 1, offsetY: 3 }, rowHdrPanel, rowHdr);
                helper.triggerMouseAction('dblclick', { x: offset.top + 1, y: offset.left + 1, offsetY: 3 }, rowHdrPanel, rowHdr);
                setTimeout((): void => {
                    expect(spreadsheet.sheets[0].rows[4].hidden).toBeFalsy();
                    done();
                });
            });
        });
    });
});