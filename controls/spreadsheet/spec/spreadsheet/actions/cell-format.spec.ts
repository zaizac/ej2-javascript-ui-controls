import { SpreadsheetHelper } from "../util/spreadsheethelper.spec";
import { defaultData } from '../util/datasource.spec';

describe('Cell Format ->', () => {
    let helper: SpreadsheetHelper = new SpreadsheetHelper('spreadsheet');


    describe('API ->', () => {
        beforeAll((done: Function) => {
            helper.initializeSpreadsheet({ sheets: [{ ranges: [{ dataSource: defaultData }], rows: [{ cells:[{ style: { fontSize: '9pt', fontFamily: 'Georgia', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left' } }] }] }], cellStyle: { fontSize: '14pt', fontFamily: 'Courier', fontWeight: 'bold', fontStyle: 'italic', textAlign: 'center' } }, done);
        });
        afterAll(() => {
            helper.invoke('destroy');
        });
        it('', (done: Function) => {
            let td: HTMLElement = helper.invoke('getCell', [0, 0]);
            expect(td.style.fontSize).toBe('9pt');
            expect(td.style.fontFamily).toBe('Georgia');
            expect(td.style.fontWeight).toBe('normal');
            expect(td.style.fontStyle).toBe('normal');
            expect(td.style.textAlign).toBe('left');

            td = helper.invoke('getCell', [0, 1]);
            expect(td.style.fontSize).toBe('14pt');
            expect(td.style.fontFamily).toBe('Courier');
            expect(td.style.fontWeight).toBe('bold');
            expect(td.style.fontStyle).toBe('italic');
            expect(td.style.textAlign).toBe('center');
            done();
        });
    });

    describe('public method ->', () => {
        beforeAll((done: Function) => {
            helper.initializeSpreadsheet({ sheets: [{ ranges: [{ dataSource: defaultData }] }] }, done);
        });
        afterAll(() => {
            helper.invoke('destroy');
        });
        it('Border', (done: Function) => {
            helper.invoke('cellFormat', [{ border: '1px solid #000' }, 'A1']);
            let td: HTMLElement = helper.invoke('getCell', [0, 0]);
            expect(td.style.borderWidth).toBe('1px');
            expect(td.style.borderStyle).toBe('solid');
            expect(td.style.borderColor).toBe('rgb(0, 0, 0)');

            helper.invoke('cellFormat', [{ border: '1px solid red' }, 'C1']);
            td = helper.invoke('getCell', [0, 2]);
            expect(td.style.borderTop).toBe('1px solid red');
            expect(td.style.borderRight).toBe('1px solid red');
            expect(td.style.borderBottom).toBe('1px solid red');
            expect(td.style.borderLeft).toBe('');
            expect(helper.invoke('getCell', [0, 1]).style.borderRight).toBe('1px solid red');

            helper.invoke('cellFormat', [{ border: '2px solid #eb4034' }, 'B5']);
            td = helper.invoke('getCell', [4, 1]);
            expect(td.style.borderTop).toBe('');
            expect(td.style.borderLeft).toBe('');
            expect(td.style.borderRight).toBe('2px solid rgb(235, 64, 52)');
            expect(td.style.borderBottom).toBe('2px solid rgb(235, 64, 52)');
            expect(helper.invoke('getCell', [3, 1]).style.borderBottom).toBe('2px solid rgb(235, 64, 52)');
            expect(helper.invoke('getCell', [4, 0]).style.borderRight).toBe('2px solid rgb(235, 64, 52)');
            done();
        });
    });

    describe('UI Interaction ->', () => {
        
    });

});