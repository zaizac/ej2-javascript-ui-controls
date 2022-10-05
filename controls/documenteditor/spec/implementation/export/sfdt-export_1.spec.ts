import { DocumentEditor } from '../../../src/document-editor/document-editor';
import { DocumentHelper } from '../../../src/document-editor/implementation/viewer/viewer';
import { createElement } from '@syncfusion/ej2-base';
import { TestHelper } from '../../test-helper.spec';
import { SfdtExport } from '../../../src/document-editor/implementation/writer/sfdt-export';

describe('Sfdt export unicode validation', () => {
    let editor: DocumentEditor;
    let documentHelper: DocumentHelper;
    beforeAll((): void => {
        let ele: HTMLElement = createElement('div', { id: 'container' });
        document.body.appendChild(ele);
        DocumentEditor.Inject(SfdtExport);
        editor = new DocumentEditor({ enableSfdtExport: true });
        (editor.documentHelper as any).containerCanvasIn = TestHelper.containerCanvas;
        (editor.documentHelper as any).selectionCanvasIn = TestHelper.selectionCanvas;
        (editor.documentHelper.render as any).pageCanvasIn = TestHelper.pageCanvas;
        (editor.documentHelper.render as any).selectionCanvasIn = TestHelper.pageSelectionCanvas;
        editor.appendTo('#container');
        documentHelper = editor.documentHelper;

    });
    afterAll((done): void => {
        documentHelper.destroy();
        documentHelper = undefined;
        editor.destroy();
        document.body.removeChild(document.getElementById('container'));
        editor = undefined;
        document.body.innerHTML = '';
        setTimeout(function () {
            done();
        }, 1000);
    });
    //     it('Unicode validation', () => {
    // console.log('Unicode validation');
    //         editor.open(JSON.stringify(unicode));
    //         expect(() => { JSON.parse(editor.sfdtExportModule.serialize()); }).not.toThrowError();
    //     });
});