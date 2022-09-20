import { SpreadsheetModel, Spreadsheet, BasicModule } from '../../../src/spreadsheet/index';
import { SpreadsheetHelper } from "../util/spreadsheethelper.spec";
import { defaultData } from '../util/datasource.spec';
import { CellModel } from '../../../src';

Spreadsheet.Inject(BasicModule);

/**
 *  Keyboard shortcuts spec
 */

describe('Spreadsheet formula bar module ->', () => {
    let helper: SpreadsheetHelper = new SpreadsheetHelper('spreadsheet');
    let model: SpreadsheetModel;
    let eventArg: Object;

    describe('UI interaction checking ->', () => {
        beforeAll((done: Function) => {
            model = {
                sheets: [
                    {
                        ranges: [
                            { dataSource: defaultData }
                        ]
                    }
                ]
            };
            helper.initializeSpreadsheet(model, done);
        });

        afterAll(() => {
            helper.invoke('destroy');
        });

        it('Cut shortcut testing', (done: Function) => {
            helper.invoke('selectRange', ['A2:A6']);
            helper.triggerKeyNativeEvent(88, true);
            setTimeout(() => {
				//Checking external cut opertion
                helper.triggerKeyEvent(
                    'cut', 88, helper.getElementFromSpreadsheet('.e-clipboard'), true, false, null, { clipboardData: new DataTransfer() });
                setTimeout(() => {
                    expect(helper.getElementFromSpreadsheet('.e-copy-indicator')).not.toBeNull();
                    helper.invoke('selectRange', ['J2']);
                    helper.triggerKeyEvent(
                        'paste', 86, helper.getElementFromSpreadsheet('.e-clipboard'), true, false, null, { clipboardData: new DataTransfer() });
                    helper.invoke('getData', ['Sheet1!J2:J6']).then((values: Map<string, CellModel>) => {
                        expect(values.get('J2').value).toEqual('Casual Shoes');
                        expect(values.get('J3').value).toEqual('Sports Shoes');
                        expect(values.get('J4').value).toEqual('Formal Shoes');
                        expect(values.get('J5').value).toEqual('Sandals & Floaters');
                        expect(values.get('J6').value).toEqual('Flip- Flops & Slippers');
                        helper.triggerKeyNativeEvent(27);
                        expect(helper.getElementFromSpreadsheet('.e-copy-indicator')).toBeNull();
                        //Checking paste from clipboard data.
                        // Unable to trigger external paste so commented
                        // helper.invoke('selectRange', ['M2']);
                        // helper.triggerKeyEvent(
                        //     'paste', 86, helper.getElementFromSpreadsheet('.e-clipboard'), true, false, null,
                        //     eventArg
                        // );
                        // helper.invoke('getData', ['Sheet1!M2:M6']).then((values: Map<string, CellModel>) => {
                        //     expect(values.get('M2').value).toEqual('Casual Shoes');
                        //     expect(values.get('M3').value).toEqual('Sports Shoes');
                        //     expect(values.get('M4').value).toEqual('Formal Shoes');
                        //     expect(values.get('M5').value).toEqual('Sandals & Floaters');
                        //     expect(values.get('M6').value).toEqual('Flip- Flops & Slippers');
                             done();
                        // });
                    });
                }, 10);
            }, 10);
        });

        it('Copy shortcut testing', (done: Function) => {
            helper.invoke('selectRange', ['D2:D6']);
            helper.triggerKeyNativeEvent(67, true);
            setTimeout(() => {
                eventArg = { clipboardData: new DataTransfer() };
                //Checking external copy opertion
                helper.triggerKeyEvent(
                    'copy', 88, helper.getElementFromSpreadsheet('.e-clipboard'), true, false, null,
                    eventArg
                );
                setTimeout(() => {
                    expect(helper.getElementFromSpreadsheet('.e-copy-indicator')).not.toBeNull();
                    helper.invoke('selectRange', ['K2']);
                    helper.triggerKeyEvent('paste', 86, helper.getElementFromSpreadsheet('.e-clipboard'), true, false, null, eventArg);
                    helper.invoke('getData', ['Sheet1!K2:K6']).then((values: Map<string, CellModel>) => {
                        expect(values.get('K2').value.toString()).toEqual('10');
                        expect(values.get('K3').value.toString()).toEqual('20');
                        expect(values.get('K4').value.toString()).toEqual('20');
                        expect(values.get('K5').value.toString()).toEqual('15');
                        expect(values.get('K6').value.toString()).toEqual('30');
                        done();
                    });
                }, 10);
            }, 10);
        });

        it('Paste shortcut testing', (done: Function) => {
            helper.invoke('selectRange', ['L2']);
            helper.triggerKeyEvent('paste', 86, helper.getElementFromSpreadsheet('.e-clipboard'), true, false, null, eventArg);
            helper.invoke('getData', ['Sheet1!L2:L6']).then((values: Map<string, CellModel>) => {
                expect(values.get('L2').value.toString()).toEqual('10');
                expect(values.get('L3').value.toString()).toEqual('20');
                expect(values.get('L4').value.toString()).toEqual('20');
                expect(values.get('L5').value.toString()).toEqual('15');
                expect(values.get('L6').value.toString()).toEqual('30');
                helper.triggerKeyNativeEvent(27);
                expect(helper.getElementFromSpreadsheet('.e-copy-indicator')).toBeNull();
                done();
            });
        });

        it('Bold shortcut testing', (done: Function) => {
            helper.triggerKeyNativeEvent(66, true);
            setTimeout(() => {
                helper.invoke('getData', ['Sheet1!L2:L6']).then((values: Map<string, CellModel>) => {
                    expect(values.get('L2').style.fontWeight).toEqual('bold');
                    expect(values.get('L3').style.fontWeight).toEqual('bold');
                    expect(values.get('L4').style.fontWeight).toEqual('bold');
                    expect(values.get('L5').style.fontWeight).toEqual('bold');
                    expect(values.get('L6').style.fontWeight).toEqual('bold');
                    done();
                });
            }, 20);
        });

        it('Bold shortcut revert testing', (done: Function) => {
            helper.triggerKeyNativeEvent(66, true);
            setTimeout(() => {
                helper.invoke('getData', ['Sheet1!L2:L6']).then((values: Map<string, CellModel>) => {
                    expect(values.get('L2').style.fontWeight).toEqual('normal');
                    expect(values.get('L3').style.fontWeight).toEqual('normal');
                    expect(values.get('L4').style.fontWeight).toEqual('normal');
                    expect(values.get('L5').style.fontWeight).toEqual('normal');
                    expect(values.get('L6').style.fontWeight).toEqual('normal');
                    done();
                });
            }, 20);
        });

        it('Italic shortcut testing', (done: Function) => {
            helper.triggerKeyNativeEvent(73, true);
            setTimeout(() => {
                helper.invoke('getData', ['Sheet1!L2:L6']).then((values: Map<string, CellModel>) => {
                    expect(values.get('L2').style.fontStyle).toEqual('italic');
                    expect(values.get('L3').style.fontStyle).toEqual('italic');
                    expect(values.get('L4').style.fontStyle).toEqual('italic');
                    expect(values.get('L5').style.fontStyle).toEqual('italic');
                    expect(values.get('L6').style.fontStyle).toEqual('italic');
                    done();
                });
            }, 20);
        });

        it('Italic shortcut revert testing', (done: Function) => {
            helper.triggerKeyNativeEvent(73, true);
            setTimeout(() => {
                helper.invoke('getData', ['Sheet1!L2:L6']).then((values: Map<string, CellModel>) => {
                    expect(values.get('L2').style.fontStyle).toEqual('normal');
                    expect(values.get('L3').style.fontStyle).toEqual('normal');
                    expect(values.get('L4').style.fontStyle).toEqual('normal');
                    expect(values.get('L5').style.fontStyle).toEqual('normal');
                    expect(values.get('L6').style.fontStyle).toEqual('normal');
                    done();
                });
            }, 20);
        });

        it('Text Decoration underline shortcut testing', (done: Function) => {
            helper.triggerKeyNativeEvent(85, true);
            setTimeout(() => {
                helper.invoke('getData', ['Sheet1!L2:L6']).then((values: Map<string, CellModel>) => {
                    expect(values.get('L2').style.textDecoration).toEqual('underline');
                    expect(values.get('L3').style.textDecoration).toEqual('underline');
                    expect(values.get('L4').style.textDecoration).toEqual('underline');
                    expect(values.get('L5').style.textDecoration).toEqual('underline');
                    expect(values.get('L6').style.textDecoration).toEqual('underline');
                    done();
                });
            }, 20);
        });

        it('Text Decoration underline shortcut revert testing', (done: Function) => {
            helper.triggerKeyNativeEvent(85, true);
            setTimeout(() => {
                helper.invoke('getData', ['Sheet1!L2:L6']).then((values: Map<string, CellModel>) => {
                    expect(values.get('L2').style.textDecoration).toEqual('none');
                    expect(values.get('L3').style.textDecoration).toEqual('none');
                    expect(values.get('L4').style.textDecoration).toEqual('none');
                    expect(values.get('L5').style.textDecoration).toEqual('none');
                    expect(values.get('L6').style.textDecoration).toEqual('none');
                    done();
                });
            }, 20);
        });

        it('Text Decoration line-through shortcut testing', (done: Function) => {
            helper.triggerKeyNativeEvent(53, true);
            setTimeout(() => {
                helper.invoke('getData', ['Sheet1!L2:L6']).then((values: Map<string, CellModel>) => {
                    expect(values.get('L2').style.textDecoration).toEqual('line-through');
                    expect(values.get('L3').style.textDecoration).toEqual('line-through');
                    expect(values.get('L4').style.textDecoration).toEqual('line-through');
                    expect(values.get('L5').style.textDecoration).toEqual('line-through');
                    expect(values.get('L6').style.textDecoration).toEqual('line-through');
                    done();
                });
            }, 20);
        });

        it('Text Decoration line-through shortcut revert testing', (done: Function) => {
            helper.triggerKeyNativeEvent(53, true);
            setTimeout(() => {
                helper.invoke('getData', ['Sheet1!L2:L6']).then((values: Map<string, CellModel>) => {
                    expect(values.get('L2').style.textDecoration).toEqual('none');
                    expect(values.get('L3').style.textDecoration).toEqual('none');
                    expect(values.get('L4').style.textDecoration).toEqual('none');
                    expect(values.get('L5').style.textDecoration).toEqual('none');
                    expect(values.get('L6').style.textDecoration).toEqual('none');
                    done();
                });
            }, 20);
        });
        it('SF-401897 -> Alt ribbon header text focus shortcut testing', (done: Function) => {
            const spreadsheet: any = helper.getInstance();
            spreadsheet.keyboardShortcutModule.ribbonShortCuts({ keyCode: 18, altKey: true, preventDefault: (): void => {} })
            expect(document.activeElement.classList.contains('e-tab-wrap')).toBeTruthy();
            expect(document.activeElement.querySelector('.e-tab-text').textContent).toBe('Home');
            helper.invoke('selectRange', ['B1']);
            helper.click(`#${helper.id}_sorting`);
            helper.click(`#${helper.id}_applyfilter`);
            spreadsheet.keyboardShortcutModule.ribbonShortCuts({ keyCode: 18, altKey: true, preventDefault: (): void => {} })
            expect(document.activeElement.classList.contains('e-tab-wrap')).toBeFalsy();
            done();
        });
    });

    describe('CR-Issues->', () => {
        describe('EJ2-54235->', () => {
            beforeEach((done: Function) => {
                helper.initializeSpreadsheet({
                    sheets: [{ rows: [{ index: 2, cells: [{ index: 2, value: 'Test' }] }] }]
                },done);
            });
            afterEach(() => {
                helper.invoke('destroy');
            });
            it('Need to prevent paste multiple times after cut action.->', (done: Function) => {
                helper.invoke('selectRange', ['C3']);
                helper.triggerKeyNativeEvent(88, true);
                setTimeout(() => {
                    helper.triggerKeyEvent('cut', 88, helper.getElementFromSpreadsheet('.e-clipboard'), true, false, null, { clipboardData: new DataTransfer() });
                    setTimeout(() => {
                        helper.invoke('selectRange', ['C5']);
                        helper.triggerKeyEvent('paste', 86, helper.getElementFromSpreadsheet('.e-clipboard'), true, false, null, { clipboardData: new DataTransfer() });            
                        setTimeout(() => {
                            expect(helper.getInstance().sheets[0].rows[4].cells[2].value.toString()).toEqual('Test');
                            helper.invoke('selectRange', ['D5']);
                            helper.triggerKeyEvent('paste', 86, helper.getElementFromSpreadsheet('.e-clipboard'), true, false, null, { clipboardData: new DataTransfer() });
                            setTimeout(() => {
                                expect(helper.getInstance().sheets[0].rows[4].cells[3]).toBeNull;
                                done();
                            });
                        }); 
                    });
                });
            });
        });
        describe('EJ2-54313->', () => {
            beforeEach((done: Function) => {
                helper.initializeSpreadsheet({
                    sheets: [{ ranges: [{ dataSource: defaultData }], selectedRange: 'H3:H7' }]
                }, done);
            });
            afterEach(() => {
                helper.invoke('destroy');
            });
            it('Redo action working incorrectly when cut and paste the cell values->', (done: Function) => {
                helper.triggerKeyNativeEvent(88, true);
                setTimeout(() => {
                    helper.triggerKeyEvent('cut', 88, helper.getElementFromSpreadsheet('.e-clipboard'), true, false, null, { clipboardData: new DataTransfer() });
                    setTimeout(() => {
                        helper.invoke('selectRange', ['J3']);
                        helper.triggerKeyEvent('paste', 86, helper.getElementFromSpreadsheet('.e-clipboard'), true, false, null, { clipboardData: new DataTransfer() });            
                        expect(helper.getInstance().sheets[0].rows[2].cells[9].value.toString()).toEqual('50');
                        expect(helper.getInstance().sheets[0].rows[6].cells[9].value.toString()).toEqual('66');
                        setTimeout(() => {
                            helper.triggerKeyNativeEvent(90, true);   
                            expect(helper.getInstance().sheets[0].rows[2].cells[9]).toBeNull;
                            expect(helper.getInstance().sheets[0].rows[6].cells[9]).toBeNull;      
                            expect(helper.getInstance().sheets[0].rows[2].cells[7].value.toString()).toEqual('50');
                            expect(helper.getInstance().sheets[0].rows[6].cells[7].value.toString()).toEqual('66');
                            setTimeout(() => {
                                helper.triggerKeyNativeEvent(89, true);  
                                setTimeout(() => {
                                    expect(helper.getInstance().sheets[0].rows[2].cells[7]).toBeNull;
                                    expect(helper.getInstance().sheets[0].rows[6].cells[7]).toBeNull;            
                                    expect(helper.getInstance().sheets[0].rows[2].cells[9].value.toString()).toEqual('50');
                                    expect(helper.getInstance().sheets[0].rows[6].cells[9].value.toString()).toEqual('66');
                                    done();
                                });
                            });
                        });
                    });
                });
            })
        });
    });
});