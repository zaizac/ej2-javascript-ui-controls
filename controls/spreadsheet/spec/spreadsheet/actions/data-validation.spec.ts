import { SpreadsheetHelper } from "../util/spreadsheethelper.spec";
import { defaultData } from '../util/datasource.spec';
import { CellModel } from "../../../src/index";


describe('Data validation ->', () => {
    let helper: SpreadsheetHelper = new SpreadsheetHelper('spreadsheet');

    describe('Public Method ->', () => {
        beforeAll((done: Function) => {
            helper.initializeSpreadsheet({
                sheets: [{
                    ranges: [{
                        dataSource: defaultData
                    }],
                }]
            }, done);
        });
        afterAll(() => {
            helper.invoke('destroy');
        });
        it('', (done: Function) => {
            helper.invoke('addDataValidation', [{ type: 'TextLength', operator: 'LessThanOrEqualTo', value1: '12' }, 'A2:A7']);
            const cell: CellModel = helper.getInstance().sheets[0].rows[1].cells[0];
            expect(JSON.stringify(cell.validation)).toBe('{"type":"TextLength","operator":"LessThanOrEqualTo","value1":"12"}');
            helper.invoke('addInvalidHighlight', ['A2:A7']);
            let td: HTMLElement = helper.invoke('getCell', [1, 0]);
            expect(td.style.backgroundColor).toBe('rgb(255, 255, 255)');
            expect(td.style.color).toBe('rgb(0, 0, 0)');
            td = helper.invoke('getCell', [4, 0]);
            expect(td.style.backgroundColor).toBe('rgb(255, 255, 0)');
            expect(td.style.color).toBe('rgb(255, 0, 0)');
            helper.invoke('removeInvalidHighlight', ['A2:A7']);
            expect(td.style.backgroundColor).toBe('rgb(255, 255, 255)');
            expect(td.style.color).toBe('rgb(0, 0, 0)');
            helper.invoke('removeDataValidation', ['A2:A7']);
            expect(helper.getInstance().sheets[0].rows[1].cells[0].validation).toBeUndefined();
            done();
        });

        it('Add list validation', (done: Function) => {
            helper.invoke('addDataValidation', [{ type: 'List', value1: '12,13,14' }, 'D2']);
            const cell: CellModel = helper.getInstance().sheets[0].rows[1].cells[3];
            expect(JSON.stringify(cell.validation)).toBe('{"type":"List","value1":"12,13,14"}');
            helper.invoke('selectRange', ['D2']);
            const td: HTMLElement = helper.invoke('getCell', [1, 3]).children[0];
            expect(td.classList).toContain('e-validation-list');
            const coords: ClientRect = td.getBoundingClientRect();
            helper.triggerMouseAction('mousedown', { x: coords.left, y: coords.top }, document, td);
            helper.triggerMouseAction('mousedup', { x: coords.left, y: coords.top }, document, td);
            (td.querySelector('.e-dropdownlist') as any).ej2_instances[0].dropDownClick({ preventDefault: function () { }, target: td.children[0] });
            setTimeout(() => {
                helper.click('.e-ddl.e-popup li:nth-child(2)');
                expect(helper.getInstance().sheets[0].rows[1].cells[3].value).toBe(13);
                expect(helper.invoke('getCell', [1, 3]).innerText).toBe('13');
                helper.editInUI('15');
                setTimeout(() => {
                    expect(helper.getElements('.e-validationerror-dlg').length).toBe(1);
                    helper.setAnimationToNone('.e-validationerror-dlg');
                    helper.click('.e-validationerror-dlg .e-footer-content button:nth-child(2)');
                    done();
                });
            });
        });
    });

    describe('UI Interaction ->', () => {
        beforeAll((done: Function) => {
            helper.initializeSpreadsheet({
                sheets: [{
                    ranges: [{
                        dataSource: defaultData
                    }],
                }]
            }, done);
        });
        afterAll(() => {
            helper.invoke('destroy');
        });
        it('Add Data validation', (done: Function) => {
            helper.invoke('selectRange', ['E2']);
            (helper.getElementFromSpreadsheet('.e-tab-header').children[0].children[5] as HTMLElement).click();
            helper.getElementFromSpreadsheet('#' + helper.id + '_datavalidation').click();
            setTimeout(() => {
                helper.click('.e-datavalidation-ddb li:nth-child(1)');
                helper.getElements('.e-datavalidation-dlg #minvalue')[0].value = '12';
                helper.getElements('.e-datavalidation-dlg #maxvalue')[0].value = '25';
                helper.setAnimationToNone('.e-datavalidation-dlg');
                helper.getElements('.e-datavalidation-dlg .e-footer-content')[0].children[1].click();
                expect(JSON.stringify(helper.getInstance().sheets[0].rows[1].cells[4].validation)).toBe('{"type":"WholeNumber","operator":"Between","value1":"12","value2":"25","ignoreBlank":true,"inCellDropDown":null}');
                helper.editInUI('26');
                setTimeout(() => {
                    expect(helper.getElements('.e-validationerror-dlg').length).toBe(1);
                    helper.setAnimationToNone('.e-validationerror-dlg');
                    helper.click('.e-validationerror-dlg .e-footer-content button:nth-child(2)');
                    expect(helper.invoke('getCell', [1, 4]).textContent).toBe('20');
                    done();
                });
            });
        });

        it('Highlight invalid data', (done: Function) => {
            helper.invoke('updateCell', [{ value: 26 }, 'E2']);
            helper.getElementFromSpreadsheet('#' + helper.id + '_datavalidation').click();
            setTimeout(() => {
                helper.click('.e-datavalidation-ddb li:nth-child(2)');
                expect(helper.invoke('getCell', [1, 4]).style.backgroundColor).toBe('rgb(255, 255, 0)');
                expect(helper.invoke('getCell', [1, 4]).style.color).toBe('rgb(255, 0, 0)');
                done();
            });
        });

        it('Remove highlight', (done: Function) => {
            helper.getElementFromSpreadsheet('#' + helper.id + '_datavalidation').click();
            setTimeout(() => {
                helper.click('.e-datavalidation-ddb li:nth-child(3)');
                expect(helper.invoke('getCell', [1, 4]).style.backgroundColor).toBe('rgb(255, 255, 255)');
                expect(helper.invoke('getCell', [1, 4]).style.color).toBe('rgb(0, 0, 0)');
                done();
            });
        });

        it('Remove data validation', (done: Function) => {
            helper.getElementFromSpreadsheet('#' + helper.id + '_datavalidation').click();
            setTimeout(() => {
                helper.click('.e-datavalidation-ddb li:nth-child(4)');
                expect(helper.getInstance().sheets[0].rows[1].cells[4].validation).toBeUndefined();
                helper.editInUI('30');
                expect(helper.getElements('.e-validationerror-dlg').length).toBe(0);
                done();
            });
        });

        it('Dialog interaction', (done: Function) => {
            helper.getElementFromSpreadsheet('#' + helper.id + '_datavalidation').click();
            setTimeout(() => {
                helper.click('.e-datavalidation-ddb li:nth-child(1)');
                setTimeout(() => {
                    let ddlElem: any = helper.getElements('.e-datavalidation-dlg .e-allow .e-dropdownlist')[0];
                    ddlElem.ej2_instances[0].dropDownClick({ preventDefault: function () { }, target: ddlElem.parentElement });
                    setTimeout(() => {
                        helper.click('.e-ddl.e-popup li:nth-child(5)');
                        ddlElem = helper.getElements('.e-datavalidation-dlg .e-data .e-dropdownlist')[0];
                        ddlElem.ej2_instances[0].dropDownClick({ preventDefault: function () { }, target: ddlElem.parentElement });
                        setTimeout(() => {
                            helper.click('.e-ddl.e-popup li:nth-child(3)');
                            helper.triggerKeyNativeEvent(9);
                            helper.getElements('.e-datavalidation-dlg .e-values .e-input')[0].value = 'dumm';
                            helper.triggerKeyEvent('keyup', 89, null, null, null, helper.getElements('.e-datavalidation-dlg .e-values e-input')[0]);
                            helper.setAnimationToNone('.e-datavalidation-dlg');
                            // helper.click('.e-datavalidation-dlg .e-footer-content button:nth-child(2)'); // This case need to be fixed
                            // expect(helper.getElements('.e-datavalidation-dlg .e-values .e-dlg-error')[0].textContent).toBe('Please enter a correct value.'); // This case need to be fixed
                            helper.getElements('.e-datavalidation-dlg .e-values .e-input')[0].value = '3';
                            helper.click('.e-datavalidation-dlg .e-footer-content button:nth-child(2)');
                            expect(JSON.stringify(helper.getInstance().sheets[0].rows[1].cells[4].validation)).toBe('{"type":"TextLength","operator":"EqualTo","value1":"3","value2":"","ignoreBlank":true,"inCellDropDown":null}');
                            done();
                        });
                    });
                });
            });
        });

        it('Add list validation for range', (done: Function) => {
            helper.invoke('addDataValidation', [{ type: 'List', value1: '=G2:G6' }, 'D2']);
            const cell: CellModel = helper.getInstance().sheets[0].rows[1].cells[3];
            expect(JSON.stringify(cell.validation)).toBe('{"type":"List","value1":"=G2:G6"}');
            helper.invoke('selectRange', ['D2']);
            const td: HTMLElement = helper.invoke('getCell', [1, 3]).children[0];
            expect(td.classList).toContain('e-validation-list');
            const coords: ClientRect = td.getBoundingClientRect();
            helper.triggerMouseAction('mousedown', { x: coords.left, y: coords.top }, document, td);
            helper.triggerMouseAction('mouseup', { x: coords.left, y: coords.top }, document, td);
            (td.querySelector('.e-dropdownlist') as any).ej2_instances[0].dropDownClick({ preventDefault: function () { }, target: td.children[0] });
            setTimeout(() => {
                helper.click('.e-ddl.e-popup li:nth-child(4)');
                setTimeout(() => {
                    expect(helper.getInstance().sheets[0].rows[1].cells[3].value).toBe(11); // Check this now
                    expect(helper.invoke('getCell', [1, 3]).innerText).toBe('11'); // check this now
                    helper.editInUI('10');
                    setTimeout(() => {
                        expect(helper.getElements('.e-validationerror-dlg').length).toBe(0);
                        done();
                    });
                });
            });
        });

        it('Add list validation for range of Whole column', (done: Function) => {
            helper.invoke('selectRange', ['I1']);
            helper.getElementFromSpreadsheet('#' + helper.id + '_datavalidation').click();
            setTimeout(() => {
                helper.click('.e-datavalidation-ddb li:nth-child(1)');
                setTimeout(() => {
                    let ddlElem: any = helper.getElements('.e-datavalidation-dlg .e-allow .e-dropdownlist')[0];
                    ddlElem.ej2_instances[0].value = 'List';
                    ddlElem.ej2_instances[0].dataBind();
                    helper.getElements('.e-datavalidation-dlg .e-values .e-input')[0].value = '=G:G';
                    helper.setAnimationToNone('.e-datavalidation-dlg');
                    helper.click('.e-datavalidation-dlg .e-footer-content button:nth-child(2)');
                    expect(JSON.stringify(helper.getInstance().sheets[0].rows[0].cells[8].validation)).toBe('{"type":"List","operator":"Between","value1":"=G:G","value2":"","ignoreBlank":true,"inCellDropDown":true}');
                    const td: HTMLElement = helper.invoke('getCell', [0, 8]).children[0];
                    (td.querySelector('.e-dropdownlist') as any).ej2_instances[0].dropDownClick({ preventDefault: function () { }, target: td.children[0] });
                    setTimeout(() => {
                        expect(helper.getElements('.e-ddl.e-popup ul')[0].textContent).toBe('Discount15711101336129');
                        helper.click('.e-ddl.e-popup li:nth-child(4)');
                        done();
                    });
                });
            });
        });
    });
});