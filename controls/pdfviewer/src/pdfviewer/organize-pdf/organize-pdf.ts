import { PdfViewer, PdfViewerBase, AjaxHandler, ISize } from '../index';
import { createElement, Browser, initializeCSPTemplate, isNullOrUndefined, getComponent, Draggable, DragEventArgs, Droppable, DropEventArgs } from '@syncfusion/ej2-base';
import { Tooltip, TooltipEventArgs, Dialog } from '@syncfusion/ej2-popups';
import { CheckBox } from '@syncfusion/ej2-buttons';
import { Toolbar, ClickEventArgs, ContextMenu, MenuItemModel, BeforeOpenCloseMenuEventArgs, ItemModel, EventArgs } from '@syncfusion/ej2-navigations';

interface IActionOrganizeElements {
    action: string;
    UndoRedoTileActions: OrganizeDetails[];
    toolbarActions: OrganizeDetails[];
    selectedPagesIndexes: number[],
    dropIndex: number,
    isRightInsertion: boolean
}

/**
 * The `PageOrganizer` module is used to handle page organize operations of PDF viewer.
 *
 * @param {Event} event - The event triggering the page organization.
 * @param {Object} args - Additional arguments for the page organization.
 * @returns {void}
 */

export class PageOrganizer {
    private pdfViewer: PdfViewer;
    private pdfViewerBase: PdfViewerBase;
    private rotateRightButton: HTMLButtonElement;
    private rotateLeftButton: HTMLButtonElement;
    private insertRightButton: HTMLButtonElement;
    private insertLeftButton: HTMLButtonElement;
    private deleteButton: HTMLButtonElement;
    private copyButton: HTMLButtonElement;
    private toolbar: Toolbar;
    /**
     * @private
     */
    public dataDetails: any[] = [];
    private thumbnail: HTMLElement;
    private imageContainer: HTMLElement;
    private organizeDialog: Dialog;
    private tileAreaWrapper: HTMLElement;
    private tileAreaDiv: HTMLElement;
    private thumbnailImage: HTMLImageElement;
    private pageLink: HTMLElement;
    private previewRequestHandler: AjaxHandler;
    private contextMenuObj: ContextMenu;
    private mobileContextMenu: MenuItemModel[] = [];
    /**
     * @private
     */
    public organizePagesCollection: OrganizeDetails[] = [];
    private tempOrganizePagesCollection: OrganizeDetails[] = [];
    private isSkipRevert: boolean = false;
    private isAllImagesReceived: boolean = false;
    private selectAllCheckBox: CheckBox;
    private totalCheckedCount: number;
    private selectedPageIndexes: number[] = [];
    private dragEndIndex: number;
    private dragHoveredIndex: number;
    private dragObj: Draggable;
    private dropObj: Droppable;
    private virtualEle: HTMLElement;
    private previousClientY: number;
    private autoScrollInterval: number = null;
    private isRightInsertion: boolean;
    private gapBetweenDivs: number = 48;
    /**
     * @private
     */
    public isDocumentModified: boolean = false;

    /**
     * @private
     */
    public undoOrganizeCollection: IActionOrganizeElements[] = [];
    /**
     * @private
     */
    public redoOrganizeCollection: IActionOrganizeElements[] = [];
    /**
     * @private
     */
    public toolbarUndoRedoCollection: OrganizeDetails[] = [];

    /**
     * @param {PdfViewer} pdfViewer - It describes about the pdfviewer
     * @param {PdfViewerBase} pdfViewerBase - It describes about the pdfviewer base
     * @private
     */
    constructor(pdfViewer: PdfViewer, pdfViewerBase: PdfViewerBase) {
        this.pdfViewer = pdfViewer;
        this.pdfViewerBase = pdfViewerBase;
    }
    /**
     * @param {boolean} isReConstruct - It describes about the isReConstruct
     * @private
     * @returns {void}
     */
    public createOrganizeWindow(isReConstruct?: boolean): void {
        const elementID: string = this.pdfViewer.element.id;
        if (!isNullOrUndefined(document.getElementById(elementID + '_organize_window')) && !isNullOrUndefined(this.organizeDialog)) {
            this.organizeDialog.show(true);
            return;
        }
        const dialogDiv: HTMLElement = createElement('div', { id: elementID + '_organize_window', className: 'e-pv-organize-window' });
        const contentRegion: HTMLElement = this.createContentArea();
        this.pdfViewerBase.mainContainer.appendChild(dialogDiv);
        this.organizeDialog = new Dialog({
            showCloseIcon: true,
            closeOnEscape: true,
            isModal: true,
            header: this.pdfViewer.localeObj.getConstant('Organize Pages'),
            target: this.pdfViewerBase.mainContainer,
            content: contentRegion,
            visible: false,
            close: (args: any) => {
                if (!this.isSkipRevert) {
                    this.tempOrganizePagesCollection = JSON.parse(JSON.stringify(this.organizePagesCollection));
                    this.undoOrganizeCollection = [];
                    this.redoOrganizeCollection = [];
                    this.isDocumentModified = false;
                    this.destroyDialogWindow();
                    this.createOrganizeWindow(true);
                    this.totalCheckedCount = 0;
                }
                else {
                    this.isSkipRevert = false;
                }
            }
        });
        if (!Browser.isDevice || this.pdfViewer.enableDesktopMode) {
            const pagecount: number = this.pdfViewerBase.pageCount;
            this.organizeDialog.buttons = [
                { buttonModel: { content: this.pdfViewer.localeObj.getConstant('Save As'), isPrimary: true }, click: this.onSaveasClicked.bind(this) },
                { buttonModel: { content: this.pdfViewer.localeObj.getConstant('Save'), isPrimary: true }, click: this.onSaveClicked.bind(this) },
                { buttonModel: { content: this.pdfViewer.localeObj.getConstant('Total') + ' ' + pagecount.toString() + ' ' + this.pdfViewer.localeObj.getConstant('Pages'), cssClass: 'e-pv-organize-total-page-button', disabled: true } }
            ];
        }
        // Listen to window resize events to update the dialog size dynamically
        window.addEventListener('resize', () => {
            this.updateOrganizeDialogSize();
        });
        if (this.pdfViewer.enableRtl) {
            this.organizeDialog.enableRtl = true;
        }
        this.organizeDialog.appendTo(dialogDiv);
        if (!isReConstruct) {
            this.organizeDialog.show(true);
        }
        this.disableTileDeleteButton();
        this.enableDisableToolbarItems();
        this.updateUndoRedoButtons();
    }

    /**
     * @private
     * @returns {void}
     */
    public createOrganizeWindowForMobile(): void {
        const elementID: string = this.pdfViewer.element.id;
        if (!isNullOrUndefined(document.getElementById(elementID + '_organize_window')) && !isNullOrUndefined(this.organizeDialog)) {
            this.organizeDialog.show(true);
            return;
        }
        const dialogDiv: HTMLElement = createElement('div', { id: elementID + '_organize_window', className: 'e-pv-organize-window' });
        const contentRegion: HTMLElement = this.createContentArea();
        this.pdfViewerBase.mainContainer.appendChild(dialogDiv);
        this.organizeDialog = new Dialog({
            showCloseIcon: true,
            closeOnEscape: true,
            isModal: true,
            header: this.pdfViewer.localeObj.getConstant('Organize PDF'),
            target: this.pdfViewerBase.mainContainer,
            content: contentRegion,
            visible: false,
            close: () => {
                if (!this.isSkipRevert) {
                    this.tempOrganizePagesCollection = JSON.parse(JSON.stringify(this.organizePagesCollection));
                    this.undoOrganizeCollection = [];
                    this.redoOrganizeCollection = [];
                    this.isDocumentModified = false;
                    this.destroyDialogWindow();
                    this.createOrganizeWindow(true);

                }
                else {
                    this.isSkipRevert = false;
                }
            }
        });
        if (!Browser.isDevice || this.pdfViewer.enableDesktopMode) {
            const pagecount: number = this.pdfViewerBase.pageCount;
            this.organizeDialog.buttons = [
                { buttonModel: { content: this.pdfViewer.localeObj.getConstant('Save As'), isPrimary: true }, click: this.onSaveasClicked.bind(this) },
                { buttonModel: { content: this.pdfViewer.localeObj.getConstant('Save'), isPrimary: true }, click: this.onSaveClicked.bind(this) },
                { buttonModel: { content: this.pdfViewer.localeObj.getConstant('Total') + ' ' + pagecount.toString() + ' ' + this.pdfViewer.localeObj.getConstant('Pages'), cssClass: 'e-pv-organize-total-page-button', disabled: true } }
            ];
        }
        // Listen to window resize events to update the dialog size dynamically
        window.addEventListener('resize', () => {
            this.updateOrganizeDialogSize();
        });
        if (this.pdfViewer.enableRtl) {
            this.organizeDialog.enableRtl = true;
        }
        this.organizeDialog.appendTo(dialogDiv);
        this.organizeDialog.show(true);
        this.createMobileContextMenu();
        this.disableTileDeleteButton();
        this.enableDisableToolbarItems();
        this.updateUndoRedoButtons();
    }

    private updateOrganizeDialogSize(): void {
        // Update the dialog size based on the viewer container size
        const dialogWidth: number = this.pdfViewer.element.getBoundingClientRect().width;
        const dialogHeight: number = this.pdfViewer.element.getBoundingClientRect().height;
        if (!isNullOrUndefined(this.organizeDialog)) {
            this.organizeDialog.width = `${dialogWidth}px`;
            this.organizeDialog.height = `${dialogHeight}px`;
        }
    }

    private createContentArea(): any {
        const elementID: string = this.pdfViewer.element.id;
        const contentDiv: HTMLElement = createElement('div', { id: elementID + '_content_appearance', className: 'e-pv-organize-content-apperance' });
        const toolbarDiv: HTMLElement = createElement('div', { id: elementID + '_toolbar_appearance', className: 'e-pv-organize-toolbar-apperance' });
        this.tileAreaWrapper = createElement('div', { id: this.pdfViewer.element.id + '_organize_tile_view_wrapper', className: 'e-pv-organize-tile-view-wrapper' });
        this.tileAreaDiv = createElement('div', { id: this.pdfViewer.element.id + '_organize_tile_view', className: 'e-pv-organize-tile-view e-pv-thumbnail-row' });
        this.tileAreaWrapper.style.width = '100%';
        this.tileAreaWrapper.style.height = 'calc(100% - 48px)';
        this.tileAreaWrapper.style.position = 'relative';
        contentDiv.style.width = '100%';
        contentDiv.style.height = '100%';
        toolbarDiv.style.height = '48px';
        this.tileAreaDiv.style.height = '100%';
        this.selectAllCheckBox = new CheckBox(
            { label: Browser.isDevice && !this.pdfViewer.enableDesktopMode ? '' : this.pdfViewer.localeObj.getConstant('Select All'), cssClass: 'e-pv-organize-select-all', checked: false, change: this.onSelectAllClick.bind(this) });
        const toolbarItems: ItemModel[] = [];
        const toolbarItemsForDesktop: ItemModel[] = [
            { type: 'Input', template: this.selectAllCheckBox, id: 'selectAllCheckbox', align: 'Left' },
            { type: 'Separator', align: 'Left' },
            {
                prefixIcon: 'e-pv-undo-icon e-pv-icon', visible: true, cssClass: 'e-pv-undo-container', id: this.pdfViewer.element.id + '_undo_organize_Pages', align: 'Left', click: (args: ClickEventArgs) => {
                    this.undo();
                }
            },
            {
                prefixIcon: 'e-pv-redo-icon e-pv-icon', visible: true, cssClass: 'e-pv-redo-container', id: this.pdfViewer.element.id + '_redo_organize_Pages', align: 'Left', click: (args: ClickEventArgs) => {
                    this.redo();
                }
            },
            {
                prefixIcon: 'e-pv-rotate-left-icon e-pv-icon', visible: true, cssClass: 'e-pv-toolbar-rotate-left', id: this.pdfViewer.element.id + '_rotate_page_left', align: 'Center', click: (args: ClickEventArgs) => {
                    this.onToolbarLeftButtonClick();
                }
            },
            {
                prefixIcon: 'e-pv-rotate-right-icon e-pv-icon', visible: true, cssClass: 'e-pv-toolbar-rotate-right', id: this.pdfViewer.element.id + '_rotate_page_right', align: 'Center', click: (args: ClickEventArgs) => {
                    this.onToolbarRightButtonClick();
                }
            },
            { type: 'Separator', align: 'Center' },
            { prefixIcon: 'e-pv-copy-icon e-pv-icon', visible: true, cssClass: 'e-pv-toolbar-rotate-right', id: this.pdfViewer.element.id + '_copy_page', align: 'Center', click: (args: ClickEventArgs) => {
                this.onToolbarCopyButtonClick();
            } },
            { type: 'Separator', align: 'Center' },
            {
                prefixIcon: 'e-pv-delete-icon e-pv-icon', visible: true, cssClass: 'e-pv-delete-selected', id: this.pdfViewer.element.id + '_delete_selected', align: 'Center', click: (args: ClickEventArgs) => {
                    this.onToolbarDeleteButtonClick();
                }
            }
        ];
        const toolbarItemsForMobile: ItemModel[] = [
            { type: 'Input', template: this.selectAllCheckBox, id: 'selectAllCheckbox', align: 'Left' },
            { type: 'Separator', align: 'Left' },
            {
                prefixIcon: 'e-pv-undo-icon e-pv-icon', visible: true, cssClass: 'e-pv-undo-container', id: this.pdfViewer.element.id + '_undo_organize_Pages', align: 'Left', click: (args: ClickEventArgs) => {
                    this.undo();
                }
            },
            {
                prefixIcon: 'e-pv-redo-icon e-pv-icon', visible: true, cssClass: 'e-pv-redo-container', id: this.pdfViewer.element.id + '_redo_organize_Pages', align: 'Left', click: (args: ClickEventArgs) => {
                    this.redo();
                }
            },
            {
                prefixIcon: 'e-pv-rotate-left-icon e-pv-icon', visible: true, cssClass: 'e-pv-toolbar-rotate-left', id: this.pdfViewer.element.id + '_rotate_page_left', align: 'Right', click: (args: ClickEventArgs) => {
                    this.onToolbarLeftButtonClick();
                }
            },
            {
                prefixIcon: 'e-pv-rotate-right-icon e-pv-icon', visible: true, cssClass: 'e-pv-toolbar-rotate-right', id: this.pdfViewer.element.id + '_rotate_page_right', align: 'Right', click: (args: ClickEventArgs) => {
                    this.onToolbarRightButtonClick();
                }
            },
            {
                prefixIcon: 'e-pv-delete-icon e-pv-icon', visible: true, cssClass: 'e-pv-delete-selected', id: this.pdfViewer.element.id + '_delete_selected', align: 'Right', click: (args: ClickEventArgs) => {
                    this.onToolbarDeleteButtonClick();
                }
            },
            { type: 'Separator', align: 'Right' },
            {
                prefixIcon: 'e-pv-more-icon e-pv-icon', visible: true, cssClass: 'e-pv-toolbar-rotate-right', id: this.pdfViewer.element.id + '_organize_more_button', align: 'Right',
                click: this.openContextMenu.bind(this)
            }
        ];
        if (Browser.isDevice && !this.pdfViewer.enableDesktopMode) {
            toolbarItems.push(...toolbarItemsForMobile);
        }
        else {
            toolbarItems.push(...toolbarItemsForDesktop);
        }
        this.toolbar = new Toolbar({
            items: toolbarItems
        });
        this.toolbar.cssClass = 'e-pv-organize-toolbar';
        this.toolbar.height = '48px';
        this.toolbar.width = 'auto';
        this.toolbar.appendTo(toolbarDiv);
        contentDiv.appendChild(toolbarDiv);
        this.renderThumbnailImage();
        this.tileAreaWrapper.appendChild(this.tileAreaDiv);
        contentDiv.appendChild(this.tileAreaWrapper);
        const rotateRightToolbarButton: HTMLElement = toolbarDiv.querySelector('#' + this.pdfViewer.element.id + '_rotate_page_right');
        if (!isNullOrUndefined(rotateRightToolbarButton)) {
            this.createTooltip(rotateRightToolbarButton, this.pdfViewer.localeObj.getConstant('Rotate Right'));
        }
        const rotateLeftToolbarButton: HTMLElement = toolbarDiv.querySelector('#' + this.pdfViewer.element.id + '_rotate_page_left');
        if (!isNullOrUndefined(rotateLeftToolbarButton)) {
            this.createTooltip(rotateLeftToolbarButton, this.pdfViewer.localeObj.getConstant('Rotate Left'));
        }
        const copyToolbarButton: HTMLElement = toolbarDiv.querySelector('#' + this.pdfViewer.element.id + '_copy_page');
        if (!isNullOrUndefined(copyToolbarButton)) {
            this.createTooltip(copyToolbarButton, this.pdfViewer.localeObj.getConstant('Copy Pages'));
        }
        const deleteToolbarButton: HTMLElement = toolbarDiv.querySelector('#' + this.pdfViewer.element.id + '_delete_selected');
        if (!isNullOrUndefined(deleteToolbarButton)) {
            this.createTooltip(deleteToolbarButton, this.pdfViewer.localeObj.getConstant('Delete Pages'));
        }
        const undoToolbarButton: HTMLElement = toolbarDiv.querySelector('#' + this.pdfViewer.element.id + '_undo_organize_Pages');
        if (!isNullOrUndefined(undoToolbarButton)) {
            this.createTooltip(undoToolbarButton, this.pdfViewer.localeObj.getConstant('Undo'));
        }
        const redoToolbarButton: HTMLElement = toolbarDiv.querySelector('#' + this.pdfViewer.element.id + '_redo_organize_Pages');
        if (!isNullOrUndefined(redoToolbarButton)) {
            this.createTooltip(redoToolbarButton, this.pdfViewer.localeObj.getConstant('Redo'));
        }
        return contentDiv;
    }

    private createMobileContextMenu(): void {
        this.mobileContextMenu = [
            { text: this.pdfViewer.localeObj.getConstant('Save') , iconCss: 'e-icons e-pv-save-icon e-pv-icon' },
            { text: this.pdfViewer.localeObj.getConstant('Save As') , iconCss: 'e-icons e-pv-save-as-icon e-pv-icon' },
            {
                separator: true
            },
            { text: this.pdfViewer.localeObj.getConstant('Copy'), iconCss: 'e-pv-copy-icon e-pv-icon' }
        ];
        const contextMenuElement: HTMLElement = createElement('ul', { id: this.pdfViewer.element.id + '_organize_context_menu' });
        this.pdfViewer.element.appendChild(contextMenuElement);
        this.contextMenuObj = new ContextMenu({
            target: '#' + this.pdfViewer.element.id + '_organize_more_button', items: this.mobileContextMenu,
            beforeOpen: this.contextMenuBeforeOpen.bind(this),
            select: this.contextMenuItemSelect.bind(this)
        });
        if (this.pdfViewer.enableRtl) {
            this.contextMenuObj.enableRtl = true;
        }
        this.contextMenuObj.appendTo(contextMenuElement);
        if (Browser.isDevice && !this.pdfViewer.enableDesktopMode) {
            this.contextMenuObj.animationSettings.effect = 'ZoomIn';
        }
        else {
            this.contextMenuObj.animationSettings.effect = 'SlideDown';
        }
    }

    private contextMenuBeforeOpen(args: BeforeOpenCloseMenuEventArgs): void {
        this.contextMenuObj.enableItems(['Save', 'Save As'], true);
        this.contextMenuObj.enableItems(['Copy'], false);
        const isCopyDisabled: boolean = false;
        if ((this.selectAllCheckBox.checked || this.selectAllCheckBox.indeterminate) &&
        this.pdfViewer.pageOrganizerSettings.canCopy && !this.getCopiedItems(isCopyDisabled)){
            this.contextMenuObj.enableItems(['Copy'], true);
        }
    }
    private getCopiedItems(isCopyDisabled: boolean): boolean {
        const selectedNodes: NodeListOf<Element> = this.tileAreaDiv.querySelectorAll('.e-pv-organize-node-selection-ring');
        selectedNodes.forEach((selectedElements: HTMLElement) => {
            const mainTileElement: HTMLElement = selectedElements.closest('.e-pv-organize-anchor-node') as HTMLElement;
            const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
            const isInserted: boolean = this.tempOrganizePagesCollection[parseInt(pageOrder.toString(), 10)].isInserted;
            const isDeleted: boolean = this.tempOrganizePagesCollection[parseInt(pageOrder.toString(), 10)].isDeleted;
            if (isInserted && !isDeleted)
            {
                isCopyDisabled = true;
            }
        });
        return isCopyDisabled;
    }
    private contextMenuItemSelect(args: any): void {
        switch (args.item.text) {
        case 'Save':
            this.onSaveClicked();
            break;
        case 'Save As':
            this.onSaveasClicked();
            break;
        case 'Copy':
            this.onToolbarCopyButtonClick();
            break;
        default:
            break;
        }
    }

    /**
     * @private
     * @returns {void}
     */
    public createRequestForPreview(): any {
        // eslint-disable-next-line
        const proxy: PageOrganizer = this;
        const isIE: boolean = !!(document as any).documentMode;
        if (!isIE) {
            return new Promise<any>(
                function (renderPreviewImage: any, reject: any): any {
                    proxy.requestPreviewCreation(proxy);
                });
        } else {
            this.requestPreviewCreation(proxy);
            return null;
        }
    }

    private requestPreviewCreation(proxy: PageOrganizer): void {
        // Removed the condition to skip multiple request for thumbnail image.
        const startIndex: number = 0;
        const previewLimit: number = proxy.pdfViewer.pageCount;
        let digitalSignaturePresent: boolean = false;
        for (let i: number = startIndex; i < previewLimit; i++) {
            if (proxy.pdfViewerBase.digitalSignaturePresent(i)) {
                digitalSignaturePresent = true;
            }
        }
        let digitalSignatureList: string = '';
        if (digitalSignaturePresent) {
            digitalSignatureList = proxy.pdfViewerBase.digitalSignaturePages.toString();
        }
        const jsonObject: object = { startPage: startIndex.toString(), endPage: previewLimit.toString(), sizeX: '99.7', sizeY: '141', hashId: proxy.pdfViewerBase.hashId, action: 'RenderThumbnailImages', elementId: proxy.pdfViewer.element.id, uniqueId: proxy.pdfViewerBase.documentId, digitalSignaturePresent: digitalSignaturePresent, digitalSignaturePageList: digitalSignatureList };
        if (this.pdfViewerBase.jsonDocumentId) {
            (jsonObject as any).documentId = this.pdfViewerBase.jsonDocumentId;
        }
        if (!this.pdfViewerBase.clientSideRendering) {
            this.previewRequestHandler = new AjaxHandler(this.pdfViewer);
            this.previewRequestHandler.url = proxy.pdfViewer.serviceUrl + '/' + proxy.pdfViewer.serverActionSettings.renderThumbnail;
            this.previewRequestHandler.responseType = 'json';
            if (previewLimit > 0 && !isNullOrUndefined(proxy.pdfViewerBase.hashId)) {
                this.previewRequestHandler.send(jsonObject);
            }
            this.previewRequestHandler.onSuccess = function (result: any): void {
                const data: any = result.data;
                const redirect: boolean = (proxy as any).pdfViewerBase.checkRedirection(data);
                if (!redirect) {
                    proxy.updatePreviewCollection(data);
                }
            };
            this.previewRequestHandler.onFailure = function (result: any): void {
                proxy.pdfViewer.fireAjaxRequestFailed(result.status, result.statusText,
                                                      proxy.pdfViewer.serverActionSettings.renderThumbnail);
            };
            this.previewRequestHandler.onError = function (result: any): void {
                proxy.pdfViewerBase.openNotificationPopup();
                proxy.pdfViewer.fireAjaxRequestFailed(result.status, result.statusText,
                                                      proxy.pdfViewer.serverActionSettings.renderThumbnail);
            };
        } else {
            for (let pageIndex: number = startIndex; pageIndex < previewLimit; pageIndex++) {
                this.pdfViewerBase.pdfViewerRunner.postMessage({
                    startIndex: startIndex,
                    endIndex: previewLimit,
                    pageIndex: pageIndex,
                    message: 'renderPreviewTileImage'
                });
            }
        }
    }

    /**
     * @param {any} data - It describes about the data
     * @private
     * @returns {void}
     */
    public updatePreviewCollection(data: any): void {
        if (data) {
            // eslint-disable-next-line
            const proxy: PageOrganizer = this;
            if (typeof data !== 'object') {
                try {
                    data = JSON.parse(data);
                } catch (error) {
                    proxy.pdfViewerBase.onControlError(500, data, proxy.pdfViewer.serverActionSettings.renderThumbnail);
                    data = null;
                }
            }
            if (data && data.uniqueId === proxy.pdfViewerBase.documentId) {
                proxy.pdfViewer.fireAjaxRequestSuccess(proxy.pdfViewer.serverActionSettings.renderThumbnail, data);
                this.getData(data, proxy.pdfViewerBase.clientSideRendering);
            }
        }
    }

    /**
     * @param {any} event - It describes about the event
     * @private
     * @returns {void}
     */
    public previewOnMessage(event: any): void {
        if (event.data.message === 'renderPreviewTileImage') {
            const canvas: HTMLCanvasElement = document.createElement('canvas');
            const { value, width, height, pageIndex, startIndex, endIndex } = event.data;
            canvas.width = width;
            canvas.height = height;
            const canvasContext: CanvasRenderingContext2D = canvas.getContext('2d');
            const imageData: ImageData = canvasContext.createImageData(width, height);
            imageData.data.set(value);
            canvasContext.putImageData(imageData, 0, 0);
            const imageUrl: string = canvas.toDataURL();
            this.pdfViewerBase.releaseCanvas(canvas);
            const data = ({
                thumbnailImage: imageUrl,
                startPage: startIndex,
                endPage: endIndex,
                uniqueId: this.pdfViewerBase.documentId,
                pageIndex: pageIndex
            });
            this.updatePreviewCollection(data);
        }
    }


    /**
     * @param {any} data - It describes about the data
     * @param {boolean} isClientRender - It describes about the isClientRender
     * @private
     * @returns {void}
     */
    public getData(data: any, isClientRender: boolean): void {
        if (!this.dataDetails) {
            this.dataDetails = [];
        }
        if (isClientRender) {
            this.dataDetails.push({ pageId: data.pageIndex, image: data.thumbnailImage });
        }
        else {
            const startPage: number = data.startPage;
            const endPage: number = data.endPage;
            for (let i: number = startPage; i < endPage; i++) {
                const thumbnailImage: any = data.thumbnailImage[parseInt(i.toString(), 10)];
                const pageId: number = i;
                this.dataDetails.push({ pageId: pageId, image: thumbnailImage });
            }
        }
        if (this.dataDetails.length === this.pdfViewer.pageCount) {
            if (!isNullOrUndefined(this.pdfViewerBase.navigationPane)) {
                this.pdfViewerBase.navigationPane.enableOrganizeButton(true);
            }
            if (!isNullOrUndefined(this.pdfViewer.toolbar)) {
                this.pdfViewer.toolbar.enableToolbarItem(['OrganizePagesTool'], true);
            }
            if (this.pdfViewer.isPageOrganizerOpen) {
                if (!Browser.isDevice || this.pdfViewer.enableDesktopMode) {
                this.createOrganizeWindow();
            }
                else {
                    this.createOrganizeWindowForMobile();
                }
            }
            this.isAllImagesReceived = true;
        }
    }

    private pageDragDrop = (event: any) : void => {
        const mainTileElement: HTMLElement = event.target.closest('.e-pv-organize-anchor-node') as HTMLElement;
        const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
        this.dragEndIndex = pageOrder;
        this.movePDFpages(this.selectedPageIndexes, this.dragEndIndex, this.isRightInsertion);
    }

    private movePDFpages(selectedPagesIndexes: number[], dropIndex: number, isRightInsertion: boolean): void {
        // Checking if the dropIndex is equal to any of the selected pages indexes
        let isDropIndexSelected: boolean = false;
        for (const index of selectedPagesIndexes) {
            if (index === dropIndex) {
                isDropIndexSelected = true;
                break;
            }
        }
        // If the dropIndex is one of the selected pages, return early
        if (isDropIndexSelected) {
            return;
        }
        const clonedCollection : OrganizeDetails[] = [];
        for (let i: number = 0; i < this.selectedPageIndexes.length; i++) {
            clonedCollection.push(this.clonedCollection(this.tempOrganizePagesCollection.
                find((item: OrganizeDetails) => { return item.currentPageIndex ===
                    this.selectedPageIndexes[parseInt(i.toString(), 10)]; })));
        }
        const cloneSelectedIndexes: number[] = [];
        cloneSelectedIndexes.push(...this.selectedPageIndexes);
        this.addOrganizeAction(clonedCollection, 'Move Pages', [], cloneSelectedIndexes, this.dragEndIndex, this.isRightInsertion);
        this.rearrangePages(selectedPagesIndexes, dropIndex, isRightInsertion);
    }

    private rearrangePages(selectedPagesIndexes: number[], dropIndex: number, isRightInsertion: boolean): void {
        const proxy: any = this;
        this.tempOrganizePagesCollection =
        this.updateCollection(this.tempOrganizePagesCollection, selectedPagesIndexes, dropIndex, isRightInsertion);
        const pages = Array.from(this.tileAreaDiv.children);
        selectedPagesIndexes.sort((a, b) => a - b);
        const draggedElements = selectedPagesIndexes.map((index: number) => pages[parseInt(index.toString(), 10)]);
        let adjustedDropIndex: number = isRightInsertion ? dropIndex + 1 : dropIndex;
        draggedElements.forEach(element => {
            pages.splice(adjustedDropIndex, 0, element);
            adjustedDropIndex += 1;
        });
        for (let i: number = 0; i < selectedPagesIndexes.length; i++) {
            if (selectedPagesIndexes[parseInt(i.toString(), 10)] >= dropIndex) {
                selectedPagesIndexes[parseInt(i.toString(), 10)] += draggedElements.length;
            }
        }
        selectedPagesIndexes.sort((a, b) => b - a).forEach(index => {
            pages.splice(index, 1);
        });
        this.tileAreaDiv.innerHTML = '';
        pages.forEach((page, index) => {
            proxy.tileAreaDiv.appendChild(page);
            page.setAttribute('data-page-order', index.toString());
        });
        this.updatePageNumber();
    }

    private updateCollection(collection: OrganizeDetails[], selectedIndexes: number[], dropIndex: number, isRightInsertion: boolean) {
        const collectionCopy: OrganizeDetails[] = [];
        let index: number = 0;
        const isAlreadyAdded: OrganizeDetails[] = [];
        selectedIndexes.sort();
        dropIndex = isRightInsertion ? dropIndex + 1 : dropIndex;
        let selectedIndexesUnderDropIndexCount: number = 0;
        selectedIndexes.forEach(index => {
            if (index < dropIndex) {
                selectedIndexesUnderDropIndexCount++;
            }
        });
        const sortedCollection = collection.sort((a: any, b: any) => this.sorting(a['currentPageIndex'], b['currentPageIndex']));
        const nullCurrentPageIndexCount = sortedCollection.filter(item => item.currentPageIndex === null).length;
        sortedCollection.forEach(function (item) {
            if (item.currentPageIndex === null) {
                collectionCopy.push({...item});
            }
        });
        //Updated currentPageIndex for the pages before drop index
        for (let i: number = 0; i < sortedCollection.length; i++) {
            // checking the given Currentpageindex exists in the selected indexes
            let isCurrentPageIndexInSelectedIndexes: boolean = false;
            for (let j: number = 0; j < selectedIndexes.length; j++) {
                if (sortedCollection[parseInt(i.toString(), 10)].currentPageIndex === selectedIndexes[parseInt(j.toString(), 10)]) {
                    isCurrentPageIndexInSelectedIndexes = true;
                    break;
                }
            }
            if (index === dropIndex - selectedIndexesUnderDropIndexCount) {
                break;
            }
            if (!isCurrentPageIndexInSelectedIndexes &&
                !this.containsPageDetails(sortedCollection[parseInt(i.toString(), 10)], isAlreadyAdded)) {
                if (!isNullOrUndefined(sortedCollection[parseInt(i.toString(), 10)].currentPageIndex)) {
                    collectionCopy.push({ ...sortedCollection[parseInt(i.toString(), 10)] });
                    isAlreadyAdded.push(sortedCollection[parseInt(i.toString(), 10)]);
                    collectionCopy[collectionCopy.length - 1].currentPageIndex = index;
                    index = index + 1;
                }
            }
        }
        //Updated currentPageIndex for the selected pages in the drop index
        for (let i: number = 0; i < sortedCollection.length; i++) {
            let isCurrentPageIndexInSelectedIndexes: boolean = false;
            for (let j: number = 0; j < selectedIndexes.length; j++) {
                if (sortedCollection[parseInt(i.toString(), 10)].currentPageIndex === selectedIndexes[parseInt(j.toString(), 10)]) {
                    isCurrentPageIndexInSelectedIndexes = true;
                    break;
                }
            }
            if (isCurrentPageIndexInSelectedIndexes &&
                !this.containsPageDetails(sortedCollection[parseInt(i.toString(), 10)], isAlreadyAdded)) {
                collectionCopy.push({ ...sortedCollection[parseInt(i.toString(), 10)] });
                isAlreadyAdded.push(sortedCollection[parseInt(i.toString(), 10)]);
                collectionCopy[collectionCopy.length - 1].currentPageIndex = index;
                index = index + 1;
            }
        }
        //Updated currentPageIndex for the pages after drop index
        for (let i: number = nullCurrentPageIndexCount; i < sortedCollection.length; i++) {
            // checking the given Currentpageindex exists in the selected indexes
            let isCurrentPageIndexInSelectedIndexes: boolean = false;
            for (let j: number = 0; j < selectedIndexes.length; j++) {
                if (sortedCollection[parseInt(i.toString(), 10)].currentPageIndex === selectedIndexes[parseInt(j.toString(), 10)]) {
                    isCurrentPageIndexInSelectedIndexes = true;
                    break;
                }
            }
            if (!isCurrentPageIndexInSelectedIndexes &&
                !this.containsPageDetails(sortedCollection[parseInt(i.toString(), 10)], isAlreadyAdded)) {
                collectionCopy.push({ ...sortedCollection[parseInt(i.toString(), 10)] });
                isAlreadyAdded.push(sortedCollection[parseInt(i.toString(), 10)]);
                collectionCopy[collectionCopy.length - 1].currentPageIndex = index;
                index = index + 1;
            }
        }
        return collectionCopy;
    }

    /**
     * @private
     */
    public sorting (a: any, b: any) {
        a = !isNullOrUndefined(a) ? parseInt(a.toString(), 10) : -1;
        b = !isNullOrUndefined(b) ? parseInt(b.toString(), 10) : -1;
        if (a > b){
            return 1;
        }
        if (a < b){
            return -1;
        }
        return 0;
    }

    private containsPageDetails(value: OrganizeDetails, array: OrganizeDetails []): boolean {
        let pageIndexFound: boolean = false;
        let currentPageIndexFound: boolean = false;
        for (let i: number = 0; i < array.length; i++) {
            if (array[parseInt(i.toString(), 10)].pageIndex === value.pageIndex) {
                pageIndexFound = true;
            }
            if (array[parseInt(i.toString(), 10)].currentPageIndex === value.currentPageIndex) {
                currentPageIndexFound = true;
            }
        }
        return pageIndexFound && currentPageIndexFound;
    }

    private renderThumbnailImage(): void {
        this.organizePagesCollection = [];
        for (let i: number = 0; i < this.pdfViewer.pageCount; i++) {
            this.tileImageRender(i);
            this.organizePagesCollection.
                push(new OrganizeDetails(i, i, null, false,
                                         false, false, false, false, false,
                                         this.getRotatedAngle(this.pdfViewerBase.pageSize[parseInt(i.toString(), 10)].rotation.toString()),
                                         this.pdfViewerBase.pageSize[parseInt(i.toString(), 10)]));
        }
        this.tempOrganizePagesCollection = JSON.parse(JSON.stringify(this.organizePagesCollection));
    }

    /**
     * @param {number} pageIndex - It describes about the page index
     * @param {number} subIndex - It describes about the sub index
     * @param {number} pageOrder - It describes about the page order
     * @param {HTMLElement} targetElement - It describes about the target element
     * @param {boolean} isNewPage - It describes about the isNewPage
     * @param {boolean} isBefore - It describes about the isBefore
     * @param {boolean} isEmptyPage - It describes about the isEmptyPage
     * @private
     * @returns {void}
     */
    public tileImageRender(pageIndex: number, subIndex?: number, pageOrder?: number, targetElement?: HTMLElement,
                           isNewPage?: boolean, isBefore?: boolean, isEmptyPage?: boolean): void {
        const base64Image: string = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAAaADAAQAAAABAAAAAQAAAAD5Ip3+AAAAC0lEQVQIHWP4DwQACfsD/Qy7W+cAAAAASUVORK5CYII=';

        this.pageLink = createElement('div', { id: 'anchor_page_' + pageIndex, className: 'e-pv-organize-anchor-node' }) as HTMLElement;
        if (isNewPage) {
            this.pageLink.id = this.pageLink.id + '_' + subIndex;
            this.pageLink.setAttribute('data-page-order', pageOrder.toString());
        }
        else {
            this.pageLink.setAttribute('data-page-order', pageIndex.toString());
        }
        this.thumbnail = createElement('div', { id: this.pdfViewer.element.id + '_organize_page_' + pageIndex, className: 'e-pv-organize-tile e-pv-thumbnail-column' });
        if (isNewPage) {
            this.thumbnail.id = this.thumbnail.id + '_' + subIndex;
        }
        this.imageContainer = createElement('div', { id: this.pdfViewer.element.id + '_container_image_' + pageIndex, className: 'e-pv-image-container' });
        if (isNewPage) {
            this.imageContainer.id = this.imageContainer.id + '_' + subIndex;
        }
        let pageSize: ISize;
        if (!isNewPage && !isEmptyPage) {
            pageSize = this.pdfViewerBase.pageSize[parseInt(pageIndex.toString(), 10)];
        }
        else {
            pageSize = this.tempOrganizePagesCollection.find((item: OrganizeDetails) =>
            { return item.currentPageIndex === pageOrder; }).pageSize;
            if (isBefore && pageOrder - 1 >= 0) {
                pageSize = this.tempOrganizePagesCollection.find(function (item: OrganizeDetails): boolean
                { return item.currentPageIndex === pageOrder - 1; }).pageSize;
            }
        }
        this.thumbnailImage = createElement('img', { id: this.pdfViewer.element.id + '_organize_image_' + pageIndex, className: 'e-pv-organize-image' }) as HTMLImageElement;
        if (isNewPage) {
            this.thumbnailImage.id = this.thumbnailImage.id + '_' + subIndex;
        }
        let width: number;
        let height: number;
        if (pageSize.height > pageSize.width) {
            width = 100 * pageSize.width / pageSize.height;
            height = 100;
        }
        else {
            width = 100;
            height = 100 * pageSize.height / pageSize.width;
        }
        this.thumbnailImage.style.width = width + '%';
        this.thumbnailImage.style.height = height + '%';
        if (isEmptyPage) {
            this.thumbnailImage.src = base64Image;
        }
        else if (pageOrder && pageOrder !== null) {
            const pageDetail: OrganizeDetails = this.tempOrganizePagesCollection.find((item: OrganizeDetails) =>
            { return item.currentPageIndex === pageOrder; });
            if (pageDetail && pageDetail.pageIndex !== -1) {
                this.thumbnailImage.src = this.dataDetails[parseInt(pageDetail.pageIndex.toString(), 10)].image;
            }
            else if (pageDetail && pageDetail.copiedPageIndex !== null && pageDetail.copiedPageIndex >= 0){
                this.thumbnailImage.src = this.dataDetails[parseInt(pageDetail.copiedPageIndex.toString(), 10)].image;
            }
            else {
                this.thumbnailImage.src = base64Image;
            }
        }
        else {
            this.thumbnailImage.src = this.dataDetails[parseInt(pageIndex.toString(), 10)].image;
        }
        this.imageContainer.addEventListener('click', (e) => {
            this.handleImageContainerClick(e);
        });
        this.thumbnailImage.alt = this.pdfViewer.element.id + '_organize_page_' + pageIndex;
        if (isNewPage) {
            this.thumbnailImage.alt = this.pdfViewer.element.id + '_organize_page_' + pageOrder;
        }
        this.imageContainer.appendChild(this.thumbnailImage);
        let rotateAngle: number = 0;
        if (isNewPage && !isNullOrUndefined(this.tempOrganizePagesCollection.find((item: OrganizeDetails): boolean =>
        { return item.currentPageIndex === pageOrder; }))) {
            rotateAngle = this.tempOrganizePagesCollection.find((item: OrganizeDetails): boolean =>
            { return item.currentPageIndex === pageOrder; }).rotateAngle;
            this.imageContainer.style.transform = 'rotate(' + rotateAngle + 'deg)';
        }
        this.thumbnail.appendChild(this.imageContainer);
        const thumbnailPageNumber: HTMLElement = createElement('div', { id: this.pdfViewer.element.id + '_tile_pagenumber_' + pageIndex, className: 'e-pv-tile-number' });
        if (isNewPage) {
            thumbnailPageNumber.id = thumbnailPageNumber.id + '_' + subIndex;
        }
        thumbnailPageNumber.textContent = (pageIndex + 1).toString();
        if (isNewPage) {
            thumbnailPageNumber.textContent = (pageOrder + 1).toString();
        }
        const input: HTMLInputElement = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'e-pv-organize-tile-checkbox';
        input.id = 'checkboxdiv_page_' + pageIndex;
        if (isNewPage) {
            input.id = input.id + '_' + subIndex;
        }
        this.thumbnail.appendChild(input);
        const checkBoxObj: CheckBox = new CheckBox({ disabled: false, checked: false, change: this.onSelectClick.bind(this) });
        checkBoxObj.appendTo(input);
        input.parentElement.style.height = '100%';
        input.parentElement.style.width = '100%';
        input.parentElement.style.display = 'none';
        const buttondiv: any = createElement('div', { id: this.pdfViewer.element.id + '_organize_buttondiv_' + pageIndex, className: 'e-pv-organize-buttondiv' });
        if (isNewPage) {
            buttondiv.id = buttondiv.id + '_' + subIndex;
        }
        this.deleteButton = createElement('button', { id: this.pdfViewer.element.id + '_delete_page_' + pageIndex, attrs: { 'aria-label': this.pdfViewer.localeObj.getConstant('Delete Page'), 'tabindex': '-1' } }) as HTMLButtonElement;
        if (isNewPage) {
            this.deleteButton.id = this.deleteButton.id + '_' + subIndex;
        }
        this.deleteButton.className = 'e-pv-tbar-btn e-pv-delete-button e-btn e-pv-organize-pdf-tile-btn';
        this.deleteButton.setAttribute('type', 'button');
        const deleteButtonSpan: HTMLElement = createElement('span', { id: this.pdfViewer.element.id + '_delete' + '_icon', className: 'e-pv-delete-icon e-pv-icon' });
        this.deleteButton.appendChild(deleteButtonSpan);
        const deleteButtonTooltip: Tooltip = new Tooltip({
            content: initializeCSPTemplate(
                function (): string { return this.pdfViewer.localeObj.getConstant('Delete Page'); }, this
            ), opensOn: 'Hover', beforeOpen: this.onTooltipBeforeOpen.bind(this)
        });
        deleteButtonTooltip.appendTo(this.deleteButton);
        this.rotateRightButton = createElement('button', { id: this.pdfViewer.element.id + '_rotate_page_' + pageIndex, attrs: { 'aria-label': this.pdfViewer.localeObj.getConstant('Rotate Right'), 'tabindex': '-1' } }) as HTMLButtonElement;
        if (isNewPage) {
            this.rotateRightButton.id = this.rotateRightButton.id + '_' + subIndex;
        }
        this.rotateRightButton.className = 'e-pv-tbar-btn e-pv-rotate-right-button e-btn e-pv-organize-pdf-tile-btn';
        this.rotateRightButton.setAttribute('type', 'button');
        const rotateButtonSpan: HTMLElement = createElement('span', { id: this.pdfViewer.element.id + '_rotate-right' + '_icon', className: 'e-pv-rotate-right-icon e-pv-icon' });
        this.rotateRightButton.appendChild(rotateButtonSpan);
        const rotateButtonTooltip: Tooltip = new Tooltip({
            content: initializeCSPTemplate(
                function (): string { return this.pdfViewer.localeObj.getConstant('Rotate Right'); }, this
            ), opensOn: 'Hover', beforeOpen: this.onTooltipBeforeOpen.bind(this)
        });
        rotateButtonTooltip.appendTo(this.rotateRightButton);
        this.rotateLeftButton = createElement('button', { id: this.pdfViewer.element.id + '_rotate_page_' + pageIndex, attrs: { 'aria-label': this.pdfViewer.localeObj.getConstant('Rotate Left'), 'tabindex': '-1' } }) as HTMLButtonElement;
        if (isNewPage) {
            this.rotateLeftButton.id = this.rotateLeftButton.id + '_' + subIndex;
        }
        this.rotateLeftButton.className = 'e-pv-tbar-btn e-pv-rotate-left-button e-btn e-pv-organize-pdf-tile-btn';
        this.rotateLeftButton.setAttribute('type', 'button');
        const rotateLeftButtonSpan: HTMLElement = createElement('span', { id: this.pdfViewer.element.id + '_rotate_left' + '_icon', className: 'e-pv-rotate-left-icon e-pv-icon' });
        this.rotateLeftButton.appendChild(rotateLeftButtonSpan);
        const rotateLeftButtonTooltip: Tooltip = new Tooltip({
            content: initializeCSPTemplate(
                function (): string { return this.pdfViewer.localeObj.getConstant('Rotate Left'); }, this
            ), opensOn: 'Hover', beforeOpen: this.onTooltipBeforeOpen.bind(this)
        });
        rotateLeftButtonTooltip.appendTo(this.rotateLeftButton);
        this.copyButton = createElement('button', { id: this.pdfViewer.element.id + '_copy_page_' + pageIndex, attrs: { 'aria-label': this.pdfViewer.localeObj.getConstant('Copy Page') , 'tabindex': '-1'} }) as HTMLButtonElement;
        if (isNewPage){
            this.copyButton.id = this.copyButton.id + '_' + subIndex;
        }
        this.copyButton.className = 'e-pv-tbar-btn e-pv-copy-button e-btn e-pv-organize-pdf-tile-btn';
        this.copyButton.setAttribute('type', 'button');
        const copyButtonSpan: HTMLElement = createElement('span', { id: this.pdfViewer.element.id + '_copy' + '_icon', className: 'e-pv-copy-icon e-pv-icon' });
        this.copyButton.appendChild(copyButtonSpan);
        const copyButtonTooltip: Tooltip = new Tooltip({
            content: initializeCSPTemplate(
                function (): string { return this.pdfViewer.localeObj.getConstant('Copy Page'); }, this
            ), opensOn: 'Hover', beforeOpen: this.onTooltipBeforeOpen.bind(this)
        });
        copyButtonTooltip.appendTo(this.copyButton);
        this.insertRightButton = createElement('button', { id: this.pdfViewer.element.id + '_insert_page_' + pageIndex, attrs: { 'aria-label': this.pdfViewer.localeObj.getConstant('Insert Right'), 'tabindex': '-1' } }) as HTMLButtonElement;
        if (isNewPage) {
            this.insertRightButton.id = this.insertRightButton.id + '_' + subIndex;
        }
        this.insertRightButton.className = 'e-pv-tbar-btn e-pv-insert-right-button e-btn e-pv-organize-pdf-tile-btn';
        this.insertRightButton.setAttribute('type', 'button');
        const insertRightButtonSpan: HTMLElement = createElement('span', { id: this.pdfViewer.element.id + '_insert_right' + '_icon', className: 'e-icons e-plus' });
        this.insertRightButton.appendChild(insertRightButtonSpan);
        const insertRightButtonTooltip: Tooltip = new Tooltip({
            content: initializeCSPTemplate(function (): any { return this.pdfViewer.localeObj.getConstant('Insert Right'); }, this), opensOn: 'Hover', beforeOpen: this.onTooltipBeforeOpen.bind(this)
        });
        insertRightButtonTooltip.appendTo(this.insertRightButton);
        this.insertLeftButton = createElement('button', { id: this.pdfViewer.element.id + '_insert_page_' + pageIndex, attrs: { 'aria-label': this.pdfViewer.localeObj.getConstant('Insert Left'), 'tabindex': '-1' } }) as HTMLButtonElement;
        if (isNewPage) {
            this.insertLeftButton.id = this.insertLeftButton.id + '_' + subIndex;
        }
        this.insertLeftButton.className = 'e-pv-tbar-btn e-pv-insert-left-button e-btn e-pv-organize-pdf-tile-btn';
        this.insertLeftButton.setAttribute('type', 'button');
        const insertLeftButtonSpan: HTMLElement = createElement('span', { id: this.pdfViewer.element.id + '_insert_left' + '_icon', className: 'e-icons e-plus' });
        this.insertLeftButton.appendChild(insertLeftButtonSpan);
        const insertLeftButtonTooltip: Tooltip = new Tooltip({
            content: initializeCSPTemplate(function (): any { return this.pdfViewer.localeObj.getConstant('Insert Left'); }, this), opensOn: 'Hover', beforeOpen: this.onTooltipBeforeOpen.bind(this)
        });
        insertLeftButtonTooltip.appendTo(this.insertLeftButton);
        if (!this.pdfViewer.pageOrganizerSettings.canInsert) {
            this.insertLeftButton.setAttribute('disabled', 'disabled');
            this.insertLeftButton.firstElementChild.classList.add('e-disabled');
            this.insertRightButton.setAttribute('disabled', 'disabled');
            this.insertRightButton.firstElementChild.classList.add('e-disabled');
        }
        if (!this.pdfViewer.pageOrganizerSettings.canRotate) {
            this.rotateLeftButton.setAttribute('disabled', 'disabled');
            this.rotateLeftButton.firstElementChild.classList.add('e-disabled');
            this.rotateRightButton.setAttribute('disabled', 'disabled');
            this.rotateRightButton.firstElementChild.classList.add('e-disabled');
        }
        if (!this.pdfViewer.pageOrganizerSettings.canDelete) {
            this.deleteButton.setAttribute('disabled', 'disabled');
            this.deleteButton.firstElementChild.classList.add('e-disabled');
        }
        if (!this.pdfViewer.pageOrganizerSettings.canCopy){
            this.copyButton.setAttribute('disabled', 'disabled');
            this.copyButton.firstElementChild.classList.add('e-disabled');
        }
        buttondiv.appendChild(this.insertLeftButton);
        buttondiv.appendChild(this.rotateLeftButton);
        buttondiv.appendChild(this.rotateRightButton);
        buttondiv.appendChild(this.copyButton);
        buttondiv.appendChild(this.deleteButton);
        buttondiv.appendChild(this.insertRightButton);
        this.thumbnail.appendChild(buttondiv);
        buttondiv.style.display = 'none';
        this.pageLink.appendChild(this.thumbnail);
        this.tileAreaDiv.appendChild(this.pageLink);
        this.pageLink.appendChild(thumbnailPageNumber);
        this.rotateRightButton.addEventListener('click', this.rotateButtonClick);
        this.rotateLeftButton.addEventListener('click', this.rotateLeftButtonClick);
        this.insertRightButton.addEventListener('click', this.insertRightButtonClick);
        this.insertLeftButton.addEventListener('click', this.insertLeftButtonClick);
        this.deleteButton.addEventListener('click', this.deleteButtonClick);
        this.copyButton.addEventListener('click', this.copyButtonClick);
        this.pageLink.addEventListener('mouseover', this.thumbnailMouseOver);
        this.pageLink.addEventListener('mouseleave', this.thumbnailMouseLeave);
        this.movePages();
        if (isNewPage) {
            if (isBefore) {
                this.tileAreaDiv.insertBefore(this.pageLink, targetElement);
            }
            else {
                this.tileAreaDiv.insertBefore(this.pageLink, targetElement.nextSibling);
            }
        }
    }

    private handleImageContainerClick(event: MouseEvent): void {
        const anchorNode = (event.target as HTMLElement).closest('.e-pv-organize-anchor-node');
        const nearestCheckBox = anchorNode.querySelector('.e-pv-organize-tile-checkbox.e-control.e-checkbox.e-lib');
        if (nearestCheckBox && !isNullOrUndefined(nearestCheckBox) &&
        !isNullOrUndefined((nearestCheckBox as any).ej2_instances) && (nearestCheckBox as any).ej2_instances.length > 0) {
            (nearestCheckBox as any).ej2_instances[0].click();
        }
    }

    private movePages(): void {
        const proxy: PageOrganizer = this;
        const draggableElement: HTMLElement = this.imageContainer;
        this.dragObj = new Draggable(draggableElement, {
            dragArea: this.tileAreaDiv,
            isDragScroll: true,
            enableTapHold: true,
            tapHoldThreshold: Browser.isDevice? 50 : 750,
            helper: (e: { sender: MouseEvent & TouchEvent, element: HTMLElement }) => {
                if (this.pdfViewer.pageOrganizerSettings.canRearrange) {
                    // Return a clone or another element as the drag avatar
                    const clone = e.element.querySelector('.e-pv-organize-image').cloneNode(true) as HTMLElement;
                    clone.style.width = e.element.querySelector('.e-pv-organize-image').clientWidth + 'px';
                    clone.style.height = e.element.querySelector('.e-pv-organize-image').clientHeight + 'px';
                    this.virtualEle = createElement('div', { className: 'e-pv-virtual-image-container' });
                    this.virtualEle.appendChild(clone);
                    this.tileAreaWrapper.appendChild(this.virtualEle);
                    return this.virtualEle;
                }
                return null;
            },
            drag: (e: DragEventArgs) => {
                if (proxy.pdfViewer.pageOrganizerSettings.canRearrange) {
                    proxy.autoScroll(e);
                    proxy.addSelectionRingStyle();
                    const mainTileElement: HTMLElement = !isNullOrUndefined(e.target) ? (e.target.closest('.e-pv-organize-anchor-node') as HTMLElement) : null;
                    if(!isNullOrUndefined(mainTileElement)) {
                        const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
                        proxy.dragHoveredIndex = pageOrder;
                        const tileRect: DOMRect = mainTileElement.getBoundingClientRect() as DOMRect;
                        let outerBorder: HTMLElement = document.querySelector('.e-pv-organize-outer-border');
                        // If the outerBorder does not exist's, creating it
                        if (isNullOrUndefined(outerBorder)) {
                            outerBorder = createElement('div', { className: 'e-pv-organize-outer-border' });
                            proxy.tileAreaWrapper.appendChild(outerBorder);
                        }
                        const isHoveredOnSelected: boolean = proxy.isHoveredOnSelectedPages(proxy.selectedPageIndexes, proxy.dragHoveredIndex);
                        if (isHoveredOnSelected) {
                            outerBorder.classList.add('e-pv-selected');
                            outerBorder.classList.remove('e-pv-not-selected');
                        } else {
                            outerBorder.classList.add('e-pv-not-selected');
                            outerBorder.classList.remove('e-pv-selected');
                        }
                        proxy.handlePageMove(e, tileRect, proxy.gapBetweenDivs, outerBorder);
                    }
                }
            },
            dragStart: (e: DragEventArgs) => {
                proxy.selectedPageIndexes = [];
                if (proxy.pdfViewer.pageOrganizerSettings.canRearrange) {
                    if ((e.element.parentElement.querySelector('.e-pv-organize-tile-checkbox') as HTMLInputElement).checked) {
                        const checkedElements = proxy.tileAreaDiv.querySelectorAll('.e-pv-organize-node-selection-ring');
                        for (let i: number = 0; i < checkedElements.length; i++) {
                            proxy.selectedPageIndexes.push(parseInt(checkedElements[parseInt(i.toString(), 10)].getAttribute('data-page-order'), 10));
                            checkedElements[parseInt(i.toString(), 10)].classList.add('e-pv-organize-tile-draggedEle');
                            const imageElement = checkedElements[parseInt(i.toString(), 10)].querySelector('.e-pv-organize-image');
                            if (imageElement) {
                                imageElement.classList.add('e-pv-organize-tile-draggedEle');
                            }
                        }
                    }
                    else {
                        const anchorElement = e.element.closest('.e-pv-organize-anchor-node');
                        if (anchorElement) {
                            proxy.selectedPageIndexes.push(parseInt(anchorElement.getAttribute('data-page-order'), 10));
                            anchorElement.classList.add('e-pv-organize-tile-draggedEle');
                            const imageElement = anchorElement.querySelector('.e-pv-organize-image');
                            if (imageElement) {
                                imageElement.classList.add('e-pv-organize-tile-draggedEle');
                            }
                        }
                    }
                    const notification = createElement('span', {
                        className: 'e-badge e-badge-primary e-badge-overlap e-badge-notification',
                        innerHTML: '' + this.selectedPageIndexes.length
                    });
                    notification.classList.add('e-pv-notification');
                    proxy.virtualEle.append(notification);
                    proxy.addSelectionRingStyle();
                }
            },
            dragStop: (e: DragEventArgs) => {
                if (proxy.autoScrollInterval !== null) {
                    clearInterval(proxy.autoScrollInterval);
                    proxy.autoScrollInterval = null;
                }
                proxy.removeSelectionRingStyle();
                if (e.target == null || !(e.target.classList.contains('e-pv-organize-image') || e.target.classList.contains('e-pv-image-container'))) {
                    proxy.virtualEle.parentNode.removeChild(proxy.virtualEle);
                    // Remove the added classes here
                    const draggedElements = proxy.tileAreaDiv.querySelectorAll('.e-pv-organize-tile-draggedEle');
                    draggedElements.forEach((element) => {
                        element.classList.remove('e-pv-organize-tile-draggedEle');
                    });
                    const outerBorder: HTMLElement = document.querySelector('.e-pv-organize-outer-border');
                    if(!isNullOrUndefined(outerBorder)) {
                        outerBorder.classList.remove('e-pv-selected', 'e-pv-not-selected');
                        proxy.selectedPageIndexes = [];
                    }
                }                
            }
        });
        const droppableElement: HTMLElement = this.thumbnail;
        this.dropObj = new Droppable(droppableElement, {
            drop: (e: DropEventArgs) => {
                if (proxy.autoScrollInterval !== null) {
                    clearInterval(proxy.autoScrollInterval);
                    proxy.autoScrollInterval = null;
                }
                proxy.removeSelectionRingStyle();
                const outerBorder = document.querySelector('.e-pv-organize-outer-border');
                // Remove the element from the DOM
                if (outerBorder) {
                    outerBorder.classList.remove('e-pv-selected', 'e-pv-not-selected');
                    outerBorder.parentNode.removeChild(outerBorder);
                }
                if (proxy.virtualEle && proxy.virtualEle.parentNode) {
                    proxy.virtualEle.parentNode.removeChild(proxy.virtualEle);
                    proxy.virtualEle = null;
                }
                proxy.pageDragDrop(e);
                const draggedElements = proxy.tileAreaDiv.querySelectorAll('.e-pv-organize-tile-draggedEle');
                draggedElements.forEach((element) => {
                    element.classList.remove('e-pv-organize-tile-draggedEle');
                });
                proxy.selectedPageIndexes = [];
            },
            over: function (e: DropEventArgs) {
            },
            out: function (e: DropEventArgs) {
                const outerBorder: HTMLElement = document.querySelector('.e-pv-organize-outer-border');
                if (!isNullOrUndefined(outerBorder)) {
                    outerBorder.classList.remove('e-pv-selected', 'e-pv-not-selected');
                }
            }
        });
    }

    private autoScroll(e: DragEventArgs): void {
        let proxy = this;
        let viewportY = e.event.type === 'touchmove' ? e.event.touches[0].clientY : e.event.clientY;
        let edgeSize = 10;
        this.autoScrollInterval = null;
        let viewportHeight = window.innerHeight;
        let edgeTop = edgeSize;
        let edgeBottom = (viewportHeight - edgeSize);
        let toolbarBottom = document.getElementById(this.pdfViewer.element.id + '_toolbar_appearance').getBoundingClientRect().bottom + edgeSize;
        let footer = this.organizeDialog.element.getElementsByClassName('e-footer-content');
        let footerBounds;
        if (!isNullOrUndefined(footer) && footer.length > 0) {
            footerBounds = footer[0].getBoundingClientRect();
        }
        let footerTop = !isNullOrUndefined(footerBounds) ? (footerBounds.top - edgeSize) : (this.tileAreaDiv.getBoundingClientRect().bottom - edgeSize);
        edgeTop = parseFloat(Math.max(edgeTop, toolbarBottom).toFixed(2));
        edgeBottom = Math.min(edgeBottom, footerTop)
        let isInTopEdge = (parseFloat(this.virtualEle.getBoundingClientRect().top.toFixed(2)) <= edgeTop);
        let isInBottomEdge = (this.virtualEle.getBoundingClientRect().bottom >= edgeBottom);
        // If the mouse is not in the viewport edge, there's no need to calculate anything else.
        if (!(isInTopEdge || isInBottomEdge)) {
            clearTimeout(this.autoScrollInterval);
            proxy.autoScrollInterval = null;
            return;
        }
        let maxScrollY = (this.tileAreaDiv.scrollHeight - this.tileAreaDiv.clientHeight);
        (function checkForWindowScroll(): void {
            clearTimeout(proxy.autoScrollInterval);
            proxy.autoScrollInterval = null;
            if (adjustWindowScroll()) {
                proxy.autoScrollInterval = window.setTimeout(checkForWindowScroll, 30);
            }
        })();
        function adjustWindowScroll(): boolean {
            let elementBounds = proxy.virtualEle.getBoundingClientRect();
            let dragDownDiffrence = elementBounds.bottom - (proxy.previousClientY + elementBounds.height);
            let dragUpDiffrence = elementBounds.top - proxy.previousClientY;
            proxy.previousClientY = elementBounds.top;
            let currentScrollY = proxy.tileAreaDiv.scrollTop;
            let canScrollUp = (currentScrollY > 0 && dragUpDiffrence <= 0);
            let canScrollDown = (currentScrollY < maxScrollY && dragDownDiffrence >= 0);
            let nextScrollY = currentScrollY;
            let maxStep = 10;
            // Should we scroll up?
            if (isInTopEdge && canScrollUp) {
                let intensity = ((edgeTop - proxy.virtualEle.getBoundingClientRect().top) / edgeSize);
                nextScrollY = (nextScrollY - (maxStep * intensity));
                // Should we scroll down?
            } else if (isInBottomEdge && canScrollDown) {
                let intensity = ((proxy.virtualEle.getBoundingClientRect().bottom - edgeBottom) / edgeSize);
                nextScrollY = (nextScrollY + (maxStep * intensity));
            }
            nextScrollY = Math.max(0, Math.min(maxScrollY, nextScrollY));
            if (nextScrollY !== currentScrollY) {
                proxy.tileAreaDiv.scrollTop = nextScrollY;
                return (true);
            } else {
                return (false);
            }
        }
    }

    private handlePageMove(e: DropEventArgs, tileRect: DOMRect, gapBetweenDivs: number,
        outerBorder: HTMLElement): void {
        const isRightInsertion: boolean = this.isTileRightInsertion(e);
        if(!isNullOrUndefined(this.isTileRightInsertion)) {
            const offset = isRightInsertion ? (tileRect['width'] + gapBetweenDivs / 2) : (-gapBetweenDivs / 2);
            const parentBound: DOMRect = outerBorder.parentElement.getBoundingClientRect() as DOMRect;
            outerBorder.style.left = (tileRect['x'] + offset - parentBound.x) + 'px';
            outerBorder.style.top = (tileRect['top'] - parentBound.y) + 'px';
            outerBorder.style.height = tileRect['height'] + 'px';
            this.isRightInsertion = isRightInsertion;
        }
    }

    private isTileRightInsertion(e: DropEventArgs): boolean {
        const mainTileElement: HTMLElement = !isNullOrUndefined(e.target) ? (e.target.closest('.e-pv-organize-anchor-node') as HTMLElement) : null;
        if (!isNullOrUndefined(mainTileElement)) {
            const tileRect: DOMRect = mainTileElement.getBoundingClientRect() as DOMRect;
            const virtualElementClientX = e.event.type == 'mousemove' ? e.event.clientX : e.event.touches[0].clientX;
            return virtualElementClientX > tileRect['x'] + (tileRect['width'] / 2);
        }
        return null;
    }

    private addSelectionRingStyle(): void {
        const anchorElements = this.tileAreaDiv.querySelectorAll('.e-pv-organize-anchor-node');
        for (let i: number = 0; i < this.selectedPageIndexes.length; i++) {
            anchorElements[this.selectedPageIndexes[parseInt(i.toString(), 10)]].classList.add('e-pv-dragging-style');
        }
    }

    private removeSelectionRingStyle(): void {
        const anchorElements = this.tileAreaDiv.querySelectorAll('.e-pv-organize-anchor-node');
        for (let i: number = 0; i < this.selectedPageIndexes.length; i++) {
            anchorElements[this.selectedPageIndexes[parseInt(i.toString(), 10)]].classList.remove('e-pv-dragging-style');
        }
    }

    private isHoveredOnSelectedPages(selectedPageIndexes: number[], hoveredIndex: number): boolean {
        let isHoveredOnSelectedPageIndex: boolean = false;
        for (let i: number = 0; i < selectedPageIndexes.length; i++) {
            if (selectedPageIndexes[parseInt(i.toString(), 10)] === hoveredIndex) {
                isHoveredOnSelectedPageIndex = true;
                break;
            }
        }
        return isHoveredOnSelectedPageIndex;
    }

    /**
     * @param {MouseEvent} event - It describes about the event
     * @private
     * @returns {void}
     */
    public thumbnailMouseOver = (event: MouseEvent): void => {
        // eslint-disable-next-line
        const proxy: PageOrganizer = this;
        if (event.currentTarget instanceof HTMLElement) {
            // Convert HTMLCollection to an array
            const childrenArray: Element[] = Array.from(event.currentTarget.children);
            // Iterate over the array
            for (const subchild of childrenArray) {
                const childArray: any[] = Array.from(subchild.children);
                for (const child of childArray) {
                    // Exclude the image by checking its type
                    if (!(child.classList.contains('e-pv-image-container'))) {
                        // Set the display style property to "none" for other children
                        (child as HTMLElement).style.display = 'flex';
                        if (child.classList.contains('e-checkbox-wrapper')) {
                            (child.children[0] as HTMLElement).style.display = 'block';
                        }
                        else if (child.classList.contains('e-pv-organize-buttondiv') && child.childElementCount > 0) {
                            const childelementArray: Element[] = Array.from(child.children);
                            for (const childelement of childelementArray) {
                                if (proxy.totalCheckedCount > 1) {
                                    if (childelement.id.split('_')[1] === 'insert') {
                                        (childelement as HTMLElement).style.display = 'flex';
                                    }
                                    else {
                                        (childelement as HTMLElement).style.display = 'none';
                                    }
                                } else {
                                    (childelement as HTMLElement).style.display = 'flex';
                                }
                            }
                        }
                    }
                }
            }
        }
    };

    /**
     * @param {MouseEvent} event - It describes about the event
     * @private
     * @returns {void}
     */
    public thumbnailMouseLeave = (event: MouseEvent): void => {
        if (event.currentTarget instanceof HTMLElement) {
            // Convert HTMLCollection to an array
            const childrenArray: Element[] = Array.from(event.currentTarget.children);
            // Iterate over the array
            for (const subchild of childrenArray) {
                const childArray: Element[] = Array.from(subchild.children);
                for (const child of childArray) {
                    // Exclude the image by checking its type
                    if (!(child.classList.contains('e-pv-image-container'))) {
                        if (event.currentTarget.classList.contains('e-pv-organize-node-selection-ring')) {
                            if (child.classList.contains('e-checkbox-wrapper')) {
                                (child as HTMLElement).style.display = 'block';
                            }
                            else {
                                (child as HTMLElement).style.display = 'none';
                            }
                        } else {
                            // Set the display style property to "none" for other children
                            (child as HTMLElement).style.display = 'none';
                        }

                    }
                }
            }
        }
    };

    /**
     * @param {OrganizeDetails[]} UndoRedoTileActions - Specifies the details of the action occured page
     * @param {string} actionString - Specifies the Name of the action
     * @param {OrganizeDetails[]} toolbarActions - Collection to store multiple action as single action
     * @param {number[]} selectedPageIndexes - Collection to store selected page index
     * @param {number} dropIndex - Specifies where the page should be dropped
     * @param {boolean} isRightInsertion - Used to check whether the page should be dropped at right
     * @returns {void}
     * @private
     */
    public addOrganizeAction(
        UndoRedoTileActions: OrganizeDetails[], actionString: string,
        toolbarActions: OrganizeDetails[], selectedPageIndexes: number[], dropIndex: number, isRightInsertion: boolean): void {
        const action: IActionOrganizeElements = {
            UndoRedoTileActions: UndoRedoTileActions, action: actionString, toolbarActions: toolbarActions,
            selectedPagesIndexes: selectedPageIndexes, dropIndex: dropIndex,
            isRightInsertion: isRightInsertion

        };
        this.undoOrganizeCollection.push(action);
        this.redoOrganizeCollection = [];
        this.updateUndoRedoButtons();
    }

    private updateUndoRedoButtons(): void {
        this.toolbar.items.forEach((item: ItemModel) => {
            if (item.id === this.pdfViewer.element.id + '_undo_organize_Pages') {
                this.enableToolbarItem(item.id, (this.undoOrganizeCollection.length > 0));
            }
            else if (item.id === this.pdfViewer.element.id + '_redo_organize_Pages') {
                this.enableToolbarItem(item.id, (this.redoOrganizeCollection.length > 0));
            }
        });
    }

    private onSelectAllClick(): void {
        // eslint-disable-next-line
        const proxy: PageOrganizer = this;
        for (let i: number = 0; i < proxy.tileAreaDiv.childElementCount; i++) {
            const childNode: ChildNode = proxy.tileAreaDiv.childNodes[parseInt(i.toString(), 10)];
            // Type assertion to HTMLElement
            if (childNode instanceof HTMLElement) {
                this.setSelectionRingStyle(this.selectAllCheckBox.element, childNode);
                const checkboxWrapper: HTMLInputElement = childNode.querySelector('.e-checkbox-wrapper') as HTMLInputElement;
                if (checkboxWrapper) {
                    // Set the display style property to "none" for other children
                    checkboxWrapper.checked = !this.selectAllCheckBox.checked;
                }
            }
        }
        this.enableDisableToolbarItems();
        if (!this.selectAllCheckBox.checked) {
            this.totalCheckedCount = 0;
        }
        else {
            this.totalCheckedCount = this.tileAreaDiv.querySelectorAll('.e-pv-organize-node-selection-ring').length;
        }
    }

    private enableDisableToolbarItems(): void {
        const isCopyDisabled: boolean = false;
        this.toolbar.items.forEach((item: ItemModel) => {
            if (item.id === this.pdfViewer.element.id + '_rotate_page_left') {
                this.enableToolbarItem(item.id, ((this.selectAllCheckBox.checked || this.selectAllCheckBox.indeterminate) &&
                this.pdfViewer.pageOrganizerSettings.canRotate));
            }
            else if (item.id === this.pdfViewer.element.id + '_rotate_page_right') {
                this.enableToolbarItem(item.id, ((this.selectAllCheckBox.checked || this.selectAllCheckBox.indeterminate) &&
                this.pdfViewer.pageOrganizerSettings.canRotate));
            }
            else if (item.id === this.pdfViewer.element.id + '_copy_page' ){
                this.enableToolbarItem(item.id, ((this.selectAllCheckBox.checked || this.selectAllCheckBox.indeterminate)
                && this.pdfViewer.pageOrganizerSettings.canCopy && !this.getCopiedItems(isCopyDisabled)));
            }
            else if (item.id === this.pdfViewer.element.id + '_delete_selected') {
                this.enableToolbarItem(item.id, this.selectAllCheckBox.indeterminate && this.pdfViewer.pageOrganizerSettings.canDelete);
            }
        });
    }

    private enableToolbarItem(elementID: string, isEnable: boolean): void {
        const element: HTMLElement = document.getElementById(elementID);
        if(!isNullOrUndefined(element) && !isNullOrUndefined(element.parentElement)) {
            this.toolbar.enableItems(element.parentElement, isEnable);
            element.setAttribute('tabindex', isEnable ? '0' : '-1');
            element.setAttribute('data-tabindex', isEnable ? '0' : '-1');
        }
    }

    private disableTileDeleteButton(): void {
        if (this.tileAreaDiv.childElementCount === 1) {
            const mainTileElement: HTMLElement = this.tileAreaDiv.querySelector('.e-pv-organize-anchor-node') as HTMLElement;
            const deleteButton: HTMLButtonElement = mainTileElement.querySelector('.e-pv-delete-button') as HTMLButtonElement;
            if (!isNullOrUndefined(deleteButton)) {
                deleteButton.setAttribute('disabled', 'disabled');
                deleteButton.firstElementChild.classList.add('e-disabled');
            }
        }
        else {
            for (let i: number = 0; i < this.tileAreaDiv.childElementCount; i++) {
                let mainTileElement: HTMLElement;
                if ((this.tileAreaDiv.childNodes[parseInt(i.toString(), 10)] as HTMLElement).classList.contains('e-pv-organize-anchor-node')) {
                    mainTileElement = this.tileAreaDiv.childNodes[parseInt(i.toString(), 10)] as HTMLElement;
                }
                else {
                    mainTileElement = (this.tileAreaDiv.childNodes[parseInt(i.toString(), 10)] as HTMLElement).querySelector('.e-pv-organize-anchor-node') as HTMLElement;
                }
                const deleteButton: HTMLButtonElement = mainTileElement.querySelector('.e-pv-delete-button') as HTMLButtonElement;
                if (!isNullOrUndefined(deleteButton) && this.pdfViewer.pageOrganizerSettings.canDelete) {
                    deleteButton.removeAttribute('disabled');
                    deleteButton.firstElementChild.classList.remove('e-disabled');
                }
            }
        }
    }

    private disableTileCopyButton(): void {
        for (let i: number = 0; i < this.tempOrganizePagesCollection.length; i++) {
            const pageInfo = this.tempOrganizePagesCollection[parseInt(i.toString(), 10)];
            if (pageInfo.isInserted && !pageInfo.isDeleted && !pageInfo.currentPageIndex != null) {
                const mainTileElement: HTMLElement  = this.tileAreaDiv.querySelector(`[data-page-order="${pageInfo.currentPageIndex.toString()}"]`);
                const copyButton: HTMLButtonElement = mainTileElement.querySelector('.e-pv-copy-button') as HTMLButtonElement;
                if (!isNullOrUndefined(copyButton)) {
                    copyButton.setAttribute('disabled', 'disabled');
                    copyButton.firstElementChild.classList.add('e-disabled');
                }
            }
        }
    }

    private onSelectClick = (args: any): void => {
        const checkboxElement: HTMLInputElement = (event.currentTarget as HTMLElement).querySelector('.e-pv-organize-tile-checkbox') as HTMLInputElement;
        const pageElement: HTMLElement = checkboxElement.closest('.e-pv-organize-anchor-node') as HTMLElement;
        if (!isNullOrUndefined(checkboxElement) && !isNullOrUndefined(pageElement)) {
            if (pageElement) {
                this.setSelectionRingStyle(checkboxElement, pageElement);
            }
        }
        this.updateSelectAllCheckbox();
        this.enableDisableToolbarItems();
        if (this.totalCheckedCount > 1) {
            for (let i: number = 0; i < pageElement.querySelector('.e-pv-organize-buttondiv').childElementCount; i++) {
                const id: string = pageElement.querySelector('.e-pv-organize-buttondiv').children[parseInt(i.toString(), 10)].id;
                if (id.split('_')[1] === 'insert') {
                    (pageElement.querySelector('.e-pv-organize-buttondiv').children[parseInt(i.toString(), 10)] as HTMLElement).style.display = 'flex';
                }
                else {
                    (pageElement.querySelector('.e-pv-organize-buttondiv').children[parseInt(i.toString(), 10)] as HTMLElement).style.display = 'none';
                }
            }
        }
    }

    private updateSelectAllCheckbox(): void {
        const totalCheckboxCount: number = this.tileAreaDiv.childElementCount;
        this.totalCheckedCount = this.tileAreaDiv.querySelectorAll('.e-pv-organize-node-selection-ring').length;
        if (this.selectAllCheckBox) {
            if (this.totalCheckedCount === 0) {
                this.selectAllCheckBox.indeterminate = false;
                this.selectAllCheckBox.checked = false;
            }
            else if (totalCheckboxCount === this.totalCheckedCount) {
                this.selectAllCheckBox.indeterminate = false;
                this.selectAllCheckBox.checked = true;
            }
            else {
                this.selectAllCheckBox.indeterminate = true;
            }
        }
    }

    private setSelectionRingStyle(checkbox: HTMLInputElement, anchornode: HTMLElement): void {
        if (!checkbox.checked) {
            anchornode.classList.remove('e-pv-organize-node-selection-ring');
        } else {
            anchornode.classList.add('e-pv-organize-node-selection-ring');
        }
        const childrenArray: Element[] = Array.from(anchornode.children);
        for (const child of childrenArray) {
            const childArray: Element[] = Array.from(child.children);
            for (const subchild of childArray) {
                if (subchild.classList.contains('e-checkbox-wrapper')) {
                    const id: any = ((subchild.getElementsByClassName('e-control e-checkbox e-lib')[0] as HTMLInputElement)).id;
                    const cbObj: any = getComponent(document.getElementById(id), 'checkbox');
                    if (checkbox.checked) {
                        (subchild as HTMLElement).style.display = 'block';
                        ((subchild as HTMLElement).children[0] as HTMLElement).style.display = 'block';
                        (cbObj as CheckBox).checked = true;
                    }
                    else {
                        (subchild as HTMLElement).style.display = 'none';
                        ((subchild as HTMLElement).children[0] as HTMLElement).style.display = 'none';
                        (cbObj as CheckBox).checked = false;
                        if (!isNullOrUndefined((subchild as HTMLElement).parentElement) && !isNullOrUndefined((subchild as HTMLElement).parentElement.lastElementChild) && (subchild as HTMLElement).parentElement.lastElementChild.classList.contains('e-pv-organize-buttondiv')) {
                            ((subchild as HTMLElement).parentElement.lastElementChild as HTMLElement).style.display = 'none';
                        }
                    }
                }
            }
        }
    }

    private onTooltipBeforeOpen(args: TooltipEventArgs): void {
        if (!this.pdfViewer.toolbarSettings.showTooltip) {
            args.cancel = true;
        }
    }

    private rotateButtonClick = (event: MouseEvent): void => {
        if (this.pdfViewer.pageOrganizerSettings.canRotate) {
            const rotateButton: HTMLElement = event.currentTarget as HTMLElement;
            const mainTileElement: HTMLElement = rotateButton.closest('.e-pv-organize-anchor-node') as HTMLElement;
            const imageContainer: HTMLElement = mainTileElement.querySelector('.e-pv-organize-image') as HTMLElement;
            const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
            if (imageContainer) {
                // Get the current rotation angle of the image container (if any)
                let currentRotation: number = parseFloat(imageContainer.style.transform.replace('rotate(', '').replace('deg)', '')) || 0;
                // Calculate the new rotation angle (add 90 degrees)
                currentRotation += 90;
                // Ensure that the rotation stays within the desired range (0, 90, 180, 270, 360)
                if (currentRotation >= 360) {
                    currentRotation = 0;
                }
                // Apply the rotation to the image container
                imageContainer.style.transform = `rotate(${currentRotation}deg)`;
                // Update the rotation value in the pageDetails collection
                this.updateTempRotationDetail(pageOrder, 90);
                const clonedCollection : OrganizeDetails[] = [];
                clonedCollection.push(this.clonedCollection(this.tempOrganizePagesCollection.
                    find((item: OrganizeDetails) => { return item.currentPageIndex === pageOrder; })));
                this.addOrganizeAction(clonedCollection, 'Rotate Right', [], [], null, false);
            }
        }
    };

    private openContextMenu(event: any): void {
        const contextMenu: HTMLElement = document.getElementById(this.pdfViewer.element.id + '_organize_context_menu');
        if (!isNullOrUndefined(contextMenu) && contextMenu.style.display !== 'block') {
            this.contextMenuObj.open(event.originalEvent.clientY, event.originalEvent.clientX, event.originalEvent.currentTarget);
        }
    }

    private rotateLeftButtonClick = (event: MouseEvent): void => {
        if (this.pdfViewer.pageOrganizerSettings.canRotate) {
            const rotateButton: HTMLElement = event.currentTarget as HTMLElement;
            const mainTileElement: HTMLElement = rotateButton.closest('.e-pv-organize-anchor-node') as HTMLElement;
            const imageContainer: HTMLElement = mainTileElement.querySelector('.e-pv-organize-image') as HTMLElement;
            const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
            if (imageContainer) {
                // Get the current rotation angle of the image container (if any)
                let currentRotation: number = parseFloat(imageContainer.style.transform.replace('rotate(', '').replace('deg)', '')) || 0;
                // Calculate the new rotation angle (add 90 degrees)
                currentRotation -= 90;
                // Ensure that the rotation stays within the desired range (0, 90, 180, 270, 360)
                if (currentRotation >= 360) {
                    currentRotation = 0;
                }
                if (currentRotation === -90) {
                    currentRotation = 270;
                }
                // Apply the rotation to the image container
                imageContainer.style.transform = `rotate(${currentRotation}deg)`;
                // Update the rotation value in the pageDetails collection
                this.updateTempRotationDetail(pageOrder, -90);
                const clonedCollection : OrganizeDetails[] = [];
                clonedCollection.push(this.clonedCollection(this.tempOrganizePagesCollection.
                    find((item: OrganizeDetails) => { return item.currentPageIndex === pageOrder; })));
                this.addOrganizeAction(clonedCollection, 'Rotate Left', [], [], null, false);
            }
        }
    };

    private onToolbarRightButtonClick = (): void => {
        if (this.pdfViewer.pageOrganizerSettings.canRotate) {
            // eslint-disable-next-line
            const proxy: PageOrganizer = this;
            for (let i: number = 0; i < proxy.tileAreaDiv.childElementCount; i++) {
                const mainTileElement: any = proxy.tileAreaDiv.childNodes[parseInt(i.toString(), 10)];
                // Type assertion to HTMLElement
                if (mainTileElement instanceof HTMLElement && mainTileElement.classList.contains('e-pv-organize-node-selection-ring')) {
                    const imageContainer: HTMLElement = mainTileElement.querySelector('.e-pv-organize-image') as HTMLElement;
                    const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
                    if (imageContainer) {
                        // Get the current rotation angle of the image container (if any)
                        let currentRotation: number = parseFloat(imageContainer.style.transform.replace('rotate(', '').replace('deg)', '')) || 0;
                        // Calculate the new rotation angle (add 90 degrees)
                        currentRotation += 90;
                        // Ensure that the rotation stays within the desired range (0, 90, 180, 270, 360)
                        if (currentRotation >= 360) {
                            currentRotation = 0;
                        }
                        // Apply the rotation to the image container
                        imageContainer.style.transform = `rotate(${currentRotation}deg)`;
                        // Update the rotation value in the pageDetails collection
                        this.updateTempRotationDetail(pageOrder, 90);
                        this.toolbarUndoRedoCollection.
                            push(this.clonedCollection(this.tempOrganizePagesCollection.
                                find((item: OrganizeDetails) => { return item.currentPageIndex === pageOrder; })));
                    }
                }
            }
            this.addOrganizeAction(null, 'Toolbar Rotate Right', this.toolbarUndoRedoCollection, [], null, false);
            this.toolbarUndoRedoCollection = [];
        }
    };

    private onToolbarLeftButtonClick = (): void => {
        // eslint-disable-next-line
        const proxy: PageOrganizer = this;
        for (let i: number = 0; i < proxy.tileAreaDiv.childElementCount; i++) {
            const mainTileElement: any = proxy.tileAreaDiv.childNodes[parseInt(i.toString(), 10)];
            // Type assertion to HTMLElement
            if (mainTileElement instanceof HTMLElement && mainTileElement.classList.contains('e-pv-organize-node-selection-ring')) {
                const imageContainer: HTMLElement = mainTileElement.querySelector('.e-pv-organize-image') as HTMLElement;
                const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
                if (imageContainer) {
                    // Get the current rotation angle of the image container (if any)
                    let currentRotation: number = parseFloat(imageContainer.style.transform.replace('rotate(', '').replace('deg)', '')) || 0;
                    // Calculate the new rotation angle (add 90 degrees)
                    currentRotation -= 90;
                    // Ensure that the rotation stays within the desired range (0, 90, 180, 270, 360)
                    if (currentRotation >= 360) {
                        currentRotation = 0;
                    }
                    if (currentRotation === -90) {
                        currentRotation = 270;
                    }
                    // Apply the rotation to the image container
                    imageContainer.style.transform = `rotate(${currentRotation}deg)`;
                    // Update the rotation value in the pageDetails collection
                    this.updateTempRotationDetail(pageOrder, -90);
                    this.toolbarUndoRedoCollection.
                        push(this.clonedCollection(this.tempOrganizePagesCollection.
                            find((item: OrganizeDetails) => { return item.currentPageIndex === pageOrder; })));
                }
            }
        }
        this.addOrganizeAction(null, 'Toolbar Rotate Left', this.toolbarUndoRedoCollection, [], null, false);
        this.toolbarUndoRedoCollection = [];
    };

    private onToolbarCopyButtonClick = (): void => {
        if (this.pdfViewer.pageOrganizerSettings.canCopy) {
            // eslint-disable-next-line
            const proxy: PageOrganizer = this;
            for (let i: number = 0; i < proxy.tileAreaDiv.childElementCount; i++) {
                const mainTileElement: HTMLElement = proxy.tileAreaDiv.childNodes[parseInt(i.toString(), 10)] as HTMLElement;
                if (mainTileElement instanceof HTMLElement && mainTileElement.classList.contains('e-pv-organize-node-selection-ring')) {
                    const pageId: string = mainTileElement.id.split('anchor_page_')[mainTileElement.id.split('anchor_page_').length - 1];
                    const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
                    const pageIdlist: string[] = pageId.split('_');
                    let subIndex: number = 0;
                    let pageIndex: number = parseInt(pageIdlist[parseInt((pageIdlist.length - 1).toString(), 10)], 10);
                    if (pageIdlist.length > 1) {
                        pageIndex = parseInt(pageIdlist[parseInt((pageIdlist.length - 2).toString(), 10)], 10);
                    }
                    subIndex = this.getNextSubIndex(mainTileElement.parentElement, pageIndex);
                    this.copyPage(pageOrder, mainTileElement);
                    this.tileImageRender(pageIndex, subIndex, pageOrder + 1, mainTileElement, true, false, false);
                    this.updatePageNumber();
                    this.toolbarUndoRedoCollection.
                        push(this.clonedCollection(this.tempOrganizePagesCollection.
                            find((item: OrganizeDetails) => { return item.currentPageIndex === (pageOrder + 1); })));
                }
            }
            this.updateTotalPageCount();
            this.disableTileDeleteButton();
            this.addOrganizeAction(null, 'Toolbar Copy', this.toolbarUndoRedoCollection, [], null, false);
            this.toolbarUndoRedoCollection = [];
        }
    };
    private onToolbarDeleteButtonClick = (): void => {
        if (this.pdfViewer.pageOrganizerSettings.canDelete) {
            // eslint-disable-next-line
            const proxy: PageOrganizer = this;
            const selectedNodes: NodeListOf<Element> = proxy.tileAreaDiv.querySelectorAll('.e-pv-organize-node-selection-ring');
            selectedNodes.forEach((selectedElements: HTMLElement) => {
                const mainTileElement: HTMLElement = selectedElements.closest('.e-pv-organize-anchor-node') as HTMLElement;
                const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
                this.toolbarUndoRedoCollection.
                    push(this.clonedCollection(this.tempOrganizePagesCollection.
                        find((item: OrganizeDetails) => { return item.currentPageIndex === pageOrder; })));
            });
            selectedNodes.forEach((selectedElement: HTMLElement) => {
                const mainTileElement: HTMLElement = selectedElement.closest('.e-pv-organize-anchor-node') as HTMLElement;
                proxy.deletePageElement(mainTileElement);
            });
        }
        this.enableDisableToolbarItems();
        this.addOrganizeAction(null, 'Toolbar Delete', this.toolbarUndoRedoCollection, [], null, false);
        this.toolbarUndoRedoCollection = [];
    };

    private updateTempRotationDetail(currentPageIndex: number, currentRotation: number): void {
        if (this.pdfViewer.pageOrganizerSettings.canRotate) {
            const tempIndex: number =
            this.tempOrganizePagesCollection.findIndex((item: OrganizeDetails) => item.currentPageIndex === currentPageIndex);
            if (tempIndex !== -1) {
                let rotateAngle: number = this.tempOrganizePagesCollection[parseInt(tempIndex.toString(), 10)].rotateAngle +
                currentRotation;
                if (rotateAngle === -90) {
                    rotateAngle = 0;
                }
                // If the pageIndex is found in the array
                this.tempOrganizePagesCollection[parseInt(tempIndex.toString(), 10)].rotateAngle =
                Math.abs((this.tempOrganizePagesCollection[parseInt(tempIndex.toString(), 10)].rotateAngle +
                currentRotation + 360) % 360);
            }
        }
        this.organizeWindowFocus();
    }

    private organizeWindowFocus(): void {
        const elementID: string = this.pdfViewer.element.id;
        document.getElementById(elementID + '_organize_window').focus();
    }

    private getRotatedAngle(rotate: string): number {
        switch (rotate.trim()) {
        case '0':
            return 0;
        case '90':
        case '1':
            return 90;
        case '180':
        case '2':
            return 180;
        case '270':
        case '3':
            return 270;
        case '360':
        case '4':
            return 0;
        default:
            return 0;
        }
    }

    private getRotation(rotateAngle: string): number {
        switch (rotateAngle.trim()) {
        case '0':
            return 0;
        case '90':
            return 1;
        case '180':
            return 2;
        case '270':
            return 3;
        case '360':
            return 0;
        default:
            return 0;
        }
    }

    private updateRotationDetailCollection(): void {
        for (let i: number = 0; i < this.tempOrganizePagesCollection.length; i++) {
            const tempPageDetail: OrganizeDetails = this.tempOrganizePagesCollection[parseInt(i.toString(), 10)];
            if (tempPageDetail.pageIndex !== -1) {
                const pageDetails: ISize = this.pdfViewerBase.pageSize[parseInt(tempPageDetail.pageIndex.toString(), 10)];
                if (Math.abs(this.getRotation(pageDetails.rotation.toString()) - tempPageDetail.rotateAngle) % 180 === 90) {
                    this.updatePageSize(tempPageDetail.pageIndex, pageDetails.height, pageDetails.width);
                }
            }
        }
    }

    private updatePageSize(pageIndex: number, pageWidth: number, pageHeight: number): void {
        if (this.pdfViewerBase.pageSize[parseInt(pageIndex.toString(), 10)]) {
            this.pdfViewerBase.pageSize[parseInt(pageIndex.toString(), 10)].width = pageWidth;
            this.pdfViewerBase.pageSize[parseInt(pageIndex.toString(), 10)].height = pageHeight;
            if (this.pdfViewerBase.highestWidth < pageWidth) {
                this.pdfViewerBase.highestWidth = pageWidth;
            }
            this.pdfViewerBase.isMixedSizeDocument = true;
        }
        for (let i: number = pageIndex; i < this.pdfViewerBase.pageSize.length; i++) {
            if (!this.pdfViewerBase.pageSize[parseInt((i - 1).toString(), 10)] && i - 1 < 0) {
                this.pdfViewerBase.pageSize[parseInt(i.toString(), 10)].top = this.pdfViewerBase.pageGap;
            }
            else {
                this.pdfViewerBase.pageSize[parseInt(i.toString(), 10)].top =
                this.pdfViewerBase.pageSize[parseInt((i - 1).toString(), 10)].top +
                this.pdfViewerBase.pageSize[parseInt((i - 1).toString(), 10)].height + this.pdfViewerBase.pageGap;
            }

        }
    }

    private onSaveClicked(): void {
        this.isSkipRevert = true;
        this.organizeDialog.hide();
        if ((JSON.stringify(this.tempOrganizePagesCollection) !== JSON.stringify(this.organizePagesCollection)) ||
        this.isDocumentModified) {
            this.updateOrganizePageCollection();
            this.isDocumentModified = true;
            let pdfBlob: Blob;
            this.pdfViewer.saveAsBlob().then((blob: Blob) => {
                pdfBlob = blob;
                this.blobToBase64(pdfBlob).then((base64: string) => {
                    if (!isNullOrUndefined(base64) && base64 !== '') {
                        const fileName: string = this.pdfViewer.fileName;
                        const downloadFileName: string = this.pdfViewer.downloadFileName;
                        const jsonDocumentId: string = this.pdfViewerBase.jsonDocumentId;
                        this.pdfViewer.load(base64, null);
                        this.pdfViewerBase.updateDocumentEditedProperty(true);
                        this.pdfViewer.fileName = fileName;
                        if (!isNullOrUndefined(downloadFileName)) {
                            this.pdfViewer.downloadFileName = downloadFileName;
                        }
                        else {
                            this.pdfViewer.downloadFileName = fileName;
                        }
                        this.pdfViewerBase.jsonDocumentId = jsonDocumentId;
                    }
                });
            });
        }

        this.undoOrganizeCollection = [];
        this.redoOrganizeCollection = [];
    }

    private blobToBase64(blob: Blob): any {
        return new Promise((resolve: (value: any) => void, _: any) => {
            const reader: FileReader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    private updateOrganizePageDetailsInViewer(): void {
        for (const pageDetail of this.organizePagesCollection) {
            const pageIndex: number = pageDetail.pageIndex;
            const rotateAngle: number = pageDetail.rotateAngle;
            let pageSizeDetails: any;
            if (pageIndex !== -1) {
                pageSizeDetails = this.pdfViewerBase.pageSize[parseInt(pageIndex.toString(), 10)];
            }
            else {
                pageSizeDetails = this.pdfViewerBase.pageSize[parseInt(pageDetail.copiedPageIndex.toString(), 10)];
            }
            const pageWidth: any = pageSizeDetails.width * this.pdfViewerBase.getZoomFactor();
            const pageHeight: any = pageSizeDetails.height * this.pdfViewerBase.getZoomFactor();
            const pageTop: number = pageSizeDetails.top * this.pdfViewerBase.getZoomFactor();
            // Find the corresponding pageDiv using pageIndex
            const pageDiv: HTMLElement = this.pdfViewerBase.getElement('_pageDiv_' + pageIndex);
            const pageCanvas: HTMLImageElement = this.pdfViewerBase.getElement('_pageCanvas_' + pageIndex) as HTMLImageElement;
            if (pageDiv && pageCanvas) {
                pageDiv.style.width = pageWidth + 'px';
                pageDiv.style.height = pageHeight + 'px';
                if (this.pdfViewer.enableRtl) {
                    pageDiv.style.right = this.pdfViewerBase.updateLeftPosition(pageIndex) + 'px';
                } else {
                    pageDiv.style.left = this.pdfViewerBase.updateLeftPosition(pageIndex) + 'px';
                }
                pageDiv.style.top = pageTop + 'px';
                this.pdfViewerBase.pageContainer.style.width = (this.pdfViewerBase.isMixedSizeDocument && (this.pdfViewerBase.highestWidth * this.pdfViewerBase.getZoomFactor()) > this.pdfViewerBase.viewerContainer.clientWidth) ? (this.pdfViewerBase.highestWidth * this.pdfViewerBase.getZoomFactor()) + 'px' : this.pdfViewerBase.viewerContainer.clientWidth + 'px';
                // Update the width and height for div
                if (rotateAngle === 90 || rotateAngle === 270) {
                    const swapWidth: string = pageDiv.style.width;
                    pageDiv.style.width = pageDiv.style.height;
                    pageDiv.style.height = swapWidth;
                } else {
                    pageDiv.style.width = '';
                    pageDiv.style.height = '';
                }
                pageDiv.style.left = (this.pdfViewerBase.viewerContainer.clientWidth - (parseInt(pageDiv.style.width, 10) * this.pdfViewerBase.getZoomFactor())) / 2 + 'px';

                // Apply rotation to the canvas
                pageCanvas.style.transform = `rotate(${rotateAngle}deg)`;
                if (rotateAngle === 90 || rotateAngle === 270) {
                    const swap: number = pageCanvas.width;
                    pageCanvas.style.width = `${pageCanvas.height}px`;
                    pageCanvas.width = pageCanvas.height;
                    pageCanvas.style.height = `${swap}px`;
                    pageCanvas.height = swap;
                    pageCanvas.style.margin = '0px';
                    // Adjust margins to center the rotated canvas
                    pageCanvas.style.marginLeft = `${(pageCanvas.height - pageCanvas.width) / 2}px`;
                    pageCanvas.style.marginTop = `${(pageCanvas.width - pageCanvas.height) / 2}px`;
                }
                else {
                    // Reset margins if not rotated by 90 or 270 degrees
                    pageCanvas.style.margin = '0px';
                }
                this.applyElementStyles(pageCanvas, pageIndex);
            }
        }
    }

    private getNextSubIndex(parentElement: HTMLElement, parentPageIndex: number): number {
        const elementsWithAnchorId: any = parentElement.querySelectorAll(`[id^='anchor_page_${parentPageIndex}']`);
        // Find the largest subindex among the existing elements
        let maxSubIndex: number = -1;
        elementsWithAnchorId.forEach((element: any) => {
            const [pageIndex, subIndex] = element.id.split('_').slice(2);
            if (Number(subIndex) > maxSubIndex) {
                maxSubIndex = Number(subIndex);
            }
        });
        return maxSubIndex + 1;
    }

    /**
     * @private
     * @returns {void}
     */
    public undo = (): void => {
        const undoActionObject: IActionOrganizeElements = this.undoOrganizeCollection.pop();
        if (undoActionObject) {
            const actionObject: IActionOrganizeElements = JSON.parse(JSON.stringify(undoActionObject));
            switch (actionObject.action) {
                case 'Insert Right':
                case 'Insert Left':
                case 'Copy':
                    this.removePage(actionObject.UndoRedoTileActions[0].currentPageIndex);
                    break;
                case 'Rotate Right':
                    this.rotateImage(actionObject.UndoRedoTileActions[0].currentPageIndex, -90);
                    break;
                case 'Rotate Left':
                    this.rotateImage(actionObject.UndoRedoTileActions[0].currentPageIndex, 90);
                    break;
                case 'Delete':
                    {
                        const mainTileElement: HTMLElement =
                            this.tileAreaDiv.childNodes[parseInt(actionObject.UndoRedoTileActions[0].
                                currentPageIndex.toString(), 10)] as HTMLElement;
                        if (actionObject.UndoRedoTileActions[0].isCopied) {
                            this.insertRemovedPages(actionObject.UndoRedoTileActions[0],
                                actionObject.UndoRedoTileActions[0].currentPageIndex,
                                mainTileElement);
                            this.tileImageRender(actionObject.UndoRedoTileActions[0].copiedPageIndex, 0,
                                actionObject.UndoRedoTileActions[0].currentPageIndex, mainTileElement,
                                true, true, false);
                        }
                        else if (actionObject.UndoRedoTileActions[0].isInserted) {
                            this.insertRemovedPages(actionObject.UndoRedoTileActions[0],
                                actionObject.UndoRedoTileActions[0].currentPageIndex,
                                mainTileElement);
                            this.tileImageRender(actionObject.UndoRedoTileActions[0].copiedPageIndex, 0,
                                actionObject.UndoRedoTileActions[0].currentPageIndex, mainTileElement,
                                true, true, true);
                        }
                        else if (!actionObject.UndoRedoTileActions[0].isCopied && !actionObject.UndoRedoTileActions[0].isInserted) {
                            this.undoDeletedPage(actionObject.UndoRedoTileActions[0].currentPageIndex,
                                actionObject.UndoRedoTileActions[0].pageIndex,
                                actionObject.UndoRedoTileActions[0].rotateAngle, mainTileElement);
                            this.tileImageRender(actionObject.UndoRedoTileActions[0].pageIndex, 0,
                                actionObject.UndoRedoTileActions[0].currentPageIndex, mainTileElement, true, true, false);
                        }
                        this.updatePageDetail();
                    }
                    break;
                case 'Move Pages':
                    {
                        const dropIndex: number = actionObject.dropIndex;
                        const isRightInsertion: boolean = actionObject.isRightInsertion;

                        const beforeDropIndex: { currentPageIndex: number, selectedIndexes: number[] }[] = [];
                        const afterDropIndex: { currentPageIndex: number, selectedIndexes: number[] }[] = [];

                        // Collect all selected indexes
                        for (let i: number = actionObject.UndoRedoTileActions.length - 1; i >= 0; i--) {
                            const action: OrganizeDetails = actionObject.UndoRedoTileActions[parseInt(i.toString(), 10)];
                            const selectedIndexes: number[] = this.tempOrganizePagesCollection
                                .filter((item: OrganizeDetails) => {
                                    return action.isCopied ? item.copiedPageIndex === action.copiedPageIndex : item.pageIndex === action.pageIndex;
                                })
                                .map((item: OrganizeDetails) => item.currentPageIndex);

                            if (selectedIndexes.length > 0) {
                                if (dropIndex < action.currentPageIndex) {
                                    afterDropIndex.push({ currentPageIndex: action.currentPageIndex, selectedIndexes: selectedIndexes });
                                } else {
                                    beforeDropIndex.push({ currentPageIndex: action.currentPageIndex, selectedIndexes: selectedIndexes });
                                }
                            }
                        }

                        // Sort and rearrange for beforeDropIndex
                        if (beforeDropIndex.length > 0) {
                            // Sort in descending order based on selectedIndexes and rearrange
                            beforeDropIndex.sort((a, b) => a.currentPageIndex - b.currentPageIndex);
                            for (let j: number = 0; j < beforeDropIndex.length; j++) {
                                this.rearrangePages(beforeDropIndex[parseInt(j.toString(), 10)].selectedIndexes, beforeDropIndex[parseInt(j.toString(), 10)].currentPageIndex, beforeDropIndex[parseInt(j.toString(), 10)].currentPageIndex > beforeDropIndex[parseInt(j.toString(), 10)].selectedIndexes[0]);
                            }
                        }

                        // Sort and rearrange for afterDropIndex
                        if (afterDropIndex.length > 0) {
                            // Sort in ascending order based on currentPageIndex and rearrange
                            afterDropIndex.sort((a, b) => b.currentPageIndex - a.currentPageIndex);
                            for (let j: number = 0; j < afterDropIndex.length; j++) {
                                this.rearrangePages(afterDropIndex[parseInt(j.toString(), 10)].selectedIndexes, afterDropIndex[parseInt(j.toString(), 10)].currentPageIndex, afterDropIndex[parseInt(j.toString(), 10)].currentPageIndex > afterDropIndex[parseInt(j.toString(), 10)].selectedIndexes[0]);
                            }
                        }
                        break;
                    }                    
                case 'Toolbar Rotate Right':
                    this.rotateImages(actionObject, -90);
                    break;
                case 'Toolbar Rotate Left':
                    this.rotateImages(actionObject, 90);
                    break;
                case 'Toolbar Copy':
                    if (actionObject.toolbarActions.length > 0) {
                        for (let i: number = actionObject.toolbarActions.length - 1; i >= 0; i--) {
                            const mainTileElement: HTMLElement =
                                this.tileAreaDiv.childNodes[parseInt(actionObject.toolbarActions[parseInt(i.toString(), 10)].
                                    currentPageIndex.toString(), 10)] as HTMLElement;
                            this.deleteTempPage(actionObject.toolbarActions[parseInt(i.toString(), 10)].currentPageIndex, mainTileElement);
                            this.tileAreaDiv.removeChild(mainTileElement);
                            this.updatePageDetail();
                        }
                    }
                    this.disableTileDeleteButton();
                    break;
                case 'Toolbar Delete':
                    {
                        if (actionObject.toolbarActions.length > 0) {
                            for (let i: number = 0; i < actionObject.toolbarActions.length; i++) {
                                const mainTileElement: HTMLElement =
                                    this.tileAreaDiv.childNodes[parseInt(actionObject.toolbarActions[parseInt(i.toString(), 10)].
                                        currentPageIndex.toString(), 10)] as HTMLElement;
                                if (actionObject.toolbarActions[parseInt(i.toString(), 10)].isCopied) {
                                    this.insertRemovedPages(actionObject.toolbarActions[parseInt(i.toString(), 10)],
                                        actionObject.toolbarActions[parseInt(i.toString(), 10)].currentPageIndex,
                                        mainTileElement);
                                    this.tileImageRender(actionObject.toolbarActions[parseInt(i.toString(), 10)].copiedPageIndex, 0,
                                        actionObject.toolbarActions[parseInt(i.toString(), 10)].currentPageIndex,
                                        mainTileElement, true, true, false);
                                }
                                else if (actionObject.toolbarActions[parseInt(i.toString(), 10)].isInserted) {
                                    this.insertRemovedPages(actionObject.toolbarActions[parseInt(i.toString(), 10)],
                                        actionObject.toolbarActions[parseInt(i.toString(), 10)].currentPageIndex,
                                        mainTileElement);
                                    this.tileImageRender(actionObject.toolbarActions[parseInt(i.toString(), 10)].copiedPageIndex, 0,
                                        actionObject.toolbarActions[parseInt(i.toString(), 10)].currentPageIndex,
                                        mainTileElement,
                                        true, true, true);
                                }
                                else if (!actionObject.toolbarActions[parseInt(i.toString(), 10)].isCopied &&
                                    !actionObject.toolbarActions[parseInt(i.toString(), 10)].isInserted) {
                                    this.undoDeletedPage(actionObject.toolbarActions[parseInt(i.toString(), 10)].currentPageIndex,
                                        actionObject.toolbarActions[parseInt(i.toString(), 10)].pageIndex,
                                        actionObject.toolbarActions[parseInt(i.toString(), 10)].rotateAngle, mainTileElement);
                                    this.tileImageRender(actionObject.toolbarActions[parseInt(i.toString(), 10)].pageIndex, 0,
                                        actionObject.toolbarActions[parseInt(i.toString(), 10)].currentPageIndex,
                                        mainTileElement, true, true, false);
                                }
                                this.updatePageDetail();
                            }
                        }
                        this.disableTileDeleteButton();
                    }
                    break;

            }
        }
        this.redoOrganizeCollection.push(undoActionObject);
        this.updateUndoRedoButtons();
    }

    /**
     * @private
     * @returns {void}
     */
    public redo = (): void => {
        const redoActionObject: IActionOrganizeElements = this.redoOrganizeCollection.pop();
        if (redoActionObject) {
            const actionObject: IActionOrganizeElements = JSON.parse(JSON.stringify(redoActionObject));
            switch (actionObject.action) {
            case 'Insert Right':
            case 'Insert Left':
                {
                    const mainTileElement: HTMLElement =
                    this.tileAreaDiv.childNodes[parseInt(actionObject.UndoRedoTileActions[0].
                        currentPageIndex.toString(), 10)] as HTMLElement;
                    this.insertRemovedPages(actionObject.UndoRedoTileActions[0],
                                            actionObject.UndoRedoTileActions[0].currentPageIndex,
                                            mainTileElement);
                    this.tileImageRender(actionObject.UndoRedoTileActions[0].copiedPageIndex, 0,
                                         actionObject.UndoRedoTileActions[0].currentPageIndex, mainTileElement, true, true, true);
                    this.updatePageDetail();
                }
                break;
            case 'Rotate Right':
                this.rotateImage(actionObject.UndoRedoTileActions[0].currentPageIndex, 90);
                break;
            case 'Rotate Left':
                this.rotateImage(actionObject.UndoRedoTileActions[0].currentPageIndex, -90);
                break;
            case 'Copy':
                {
                    const mainTileElement: HTMLElement =
                        this.tileAreaDiv.childNodes[parseInt(actionObject.UndoRedoTileActions[0].
                            currentPageIndex.toString(), 10)] as HTMLElement;
                    this.insertRemovedPages(actionObject.UndoRedoTileActions[0],
                                            actionObject.UndoRedoTileActions[0].currentPageIndex,
                                            mainTileElement);
                    this.tileImageRender(actionObject.UndoRedoTileActions[0].copiedPageIndex, 0,
                                         actionObject.UndoRedoTileActions[0].currentPageIndex, mainTileElement, true, true, false);
                }
                break;
            case 'Delete':
                this.removePage(actionObject.UndoRedoTileActions[0].currentPageIndex);
                break;
            case 'Move Pages':
                this.rearrangePages(actionObject.selectedPagesIndexes, actionObject.dropIndex, actionObject.isRightInsertion);
                break;
            case 'Toolbar Rotate Right':
                this.rotateImages(actionObject, 90);
                break;
            case 'Toolbar Rotate Left':
                this.rotateImages(actionObject, -90);
                break;
            case 'Toolbar Copy':
                {
                    if (actionObject.toolbarActions.length > 0) {
                        for (let i: number = 0; i < actionObject.toolbarActions.length; i++) {
                            const mainTileElement: HTMLElement =
                            this.tileAreaDiv.childNodes[parseInt(actionObject.toolbarActions[parseInt(i.toString(), 10)].
                                currentPageIndex.toString(), 10)] as HTMLElement;
                            this.insertRemovedPages(actionObject.toolbarActions[parseInt(i.toString(), 10)],
                                                    actionObject.toolbarActions[parseInt(i.toString(), 10)].currentPageIndex,
                                                    mainTileElement);
                            this.tileImageRender(actionObject.toolbarActions[parseInt(i.toString(), 10)].copiedPageIndex, 0,
                                                 actionObject.toolbarActions[parseInt(i.toString(), 10)].currentPageIndex,
                                                 mainTileElement, true, true, false);
                            this.updatePageDetail();
                        }
                    }
                    this.disableTileDeleteButton();
                }
                break;
            case 'Toolbar Delete':
                if (actionObject.toolbarActions.length > 0) {
                    for (let i: number = actionObject.toolbarActions.length - 1; i >= 0; i--) {
                        const mainTileElement: HTMLElement =
                        this.tileAreaDiv.childNodes[parseInt(actionObject.toolbarActions[parseInt(i.toString(), 10)].
                            currentPageIndex.toString(), 10)] as HTMLElement;
                        this.deleteTempPage(actionObject.toolbarActions[parseInt(i.toString(), 10)].currentPageIndex, mainTileElement);
                        this.tileAreaDiv.removeChild(mainTileElement);
                        this.updatePageDetail();
                    }
                }
                this.disableTileDeleteButton();
                break;
            }
        }
        this.undoOrganizeCollection.push(redoActionObject);
        this.updateUndoRedoButtons();
    }

    private removePage(pageOrder: number): void {
        const mainTileElement: HTMLElement = this.tileAreaDiv.childNodes[parseInt(pageOrder.toString(), 10)] as HTMLElement;
        this.deleteTempPage(pageOrder, mainTileElement);
        this.tileAreaDiv.removeChild(mainTileElement);
        this.updatePageDetail();
    }
    private rotateImages = (actionObject: IActionOrganizeElements, rotationAngle: number) => {
        if (actionObject.toolbarActions.length > 0) {
            for (let i: number = 0; i < actionObject.toolbarActions.length; i++) {
                const mainTileElement: HTMLElement =
                    this.tileAreaDiv.childNodes[parseInt(actionObject.toolbarActions[parseInt(i.toString(), 10)].
                        currentPageIndex.toString(), 10)] as HTMLElement;
                const imageContainer: HTMLElement = mainTileElement.querySelector('.e-pv-organize-image') as HTMLElement;
                if (imageContainer) {
                    let currentRotation: number = parseFloat(imageContainer.style.transform.replace('rotate(', '').replace('deg)', '')) || 0;
                    currentRotation = (currentRotation + rotationAngle + 360) % 360;
                    imageContainer.style.transform = `rotate(${currentRotation}deg)`;
                    this.updateTempRotationDetail(actionObject.toolbarActions[parseInt(i.toString(), 10)].currentPageIndex, rotationAngle);
                }
            }
        }
    };

    private rotateImage(currentPageIndex: number, rotationAngle: number): void {
        const mainTileElement: HTMLElement = this.tileAreaDiv.childNodes[parseInt(currentPageIndex.toString(), 10)] as HTMLElement;
        const imageContainer: HTMLElement = mainTileElement.querySelector('.e-pv-organize-image') as HTMLElement;
        if (imageContainer) {
            let currentRotation: number = parseFloat(imageContainer.style.transform.replace('rotate(', '').replace('deg)', '')) || 0;
            currentRotation = (currentRotation + rotationAngle + 360) % 360;
            imageContainer.style.transform = `rotate(${currentRotation}deg)`;
            this.updateTempRotationDetail(currentPageIndex, rotationAngle);
        }
    }

    private updatePageDetail(): void {
        this.updateTotalPageCount();
        this.updatePageNumber();
    }

    private insertRightButtonClick = (event: MouseEvent): void => {
        if (this.pdfViewer.pageOrganizerSettings.canInsert) {
            const insertRightButton: HTMLElement = event.currentTarget as HTMLElement;
            const buttonId: string = insertRightButton.id.split('_insert_page_')[insertRightButton.id.split('_insert_page_').length - 1];
            const mainTileElement: HTMLElement = insertRightButton.closest('.e-pv-organize-anchor-node') as HTMLElement;
            const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
            const buttonIdlist: string[] = buttonId.split('_');
            let subIndex: number = 0;
            let buttonIndex: number = parseInt(buttonIdlist[parseInt((buttonIdlist.length - 1).toString(), 10)], 10);
            if (buttonIdlist.length > 1) {
                buttonIndex = parseInt(buttonIdlist[parseInt((buttonIdlist.length - 2).toString(), 10)], 10);
            }
            subIndex = this.getNextSubIndex(mainTileElement.parentElement, buttonIndex);
            this.insertTempPage(pageOrder, false, mainTileElement);
            this.tileImageRender(buttonIndex, subIndex, pageOrder + 1, mainTileElement, true, false, true);
            this.updateTotalPageCount();
            this.updatePageNumber();
            this.disableTileDeleteButton();
            this.disableTileCopyButton();
            this.updateSelectAllCheckbox();
            this.enableDisableToolbarItems();
            const clonedCollection : OrganizeDetails[] = [];
            clonedCollection.push(this.clonedCollection(this.tempOrganizePagesCollection.
                find((item: OrganizeDetails) => { return item.currentPageIndex === (pageOrder + 1); })));
            this.addOrganizeAction(clonedCollection, 'Insert Right', [], [], null, false);
        }
    }

    private insertLeftButtonClick = (event: MouseEvent): void => {
        if (this.pdfViewer.pageOrganizerSettings.canInsert) {
            const insetLeftButton: HTMLElement = event.currentTarget as HTMLElement;
            const buttonId: string = insetLeftButton.id.split('_insert_page_')[insetLeftButton.id.split('_insert_page_').length - 1];
            const mainTileElement: HTMLElement = insetLeftButton.closest('.e-pv-organize-anchor-node') as HTMLElement;
            const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
            const buttonIdlist: string[] = buttonId.split('_');
            let subIndex: number = 0;
            let buttonIndex: number = parseInt(buttonIdlist[parseInt((buttonIdlist.length - 1).toString(), 10)], 10);
            if (buttonIdlist.length > 1) {
                buttonIndex = parseInt(buttonIdlist[parseInt((buttonIdlist.length - 2).toString(), 10)], 10);
            }
            subIndex = this.getNextSubIndex(mainTileElement.parentElement, buttonIndex);
            this.insertTempPage(pageOrder, true, mainTileElement);
            this.tileImageRender(buttonIndex, subIndex, pageOrder, mainTileElement, true, true, true);
            this.updateTotalPageCount();
            this.updatePageNumber();
            this.disableTileDeleteButton();
            this.disableTileCopyButton();
            this.updateSelectAllCheckbox();
            this.enableDisableToolbarItems();
            const clonedCollection : OrganizeDetails[] = [];
            clonedCollection.push(this.clonedCollection(this.tempOrganizePagesCollection.
                find((item: OrganizeDetails) => { return item.currentPageIndex === pageOrder; })));
            this.addOrganizeAction(clonedCollection, 'Insert Left', [], [], null, false);
        }
    }

    private copyButtonClick = (event: MouseEvent): void => {
        if (this.pdfViewer.pageOrganizerSettings.canCopy)
        {
            const copyButton: HTMLElement = event.currentTarget as HTMLElement;
            const buttonId: string = copyButton.id.split('_copy_page_')[copyButton.id.split('_copy_page_').length - 1];
            const mainTileElement: HTMLElement = copyButton.closest('.e-pv-organize-anchor-node') as HTMLElement;
            const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
            const buttonIdlist: string[] = buttonId.split('_');
            let subIndex: number = 0;
            let buttonIndex: number = parseInt(buttonIdlist[parseInt((buttonIdlist.length - 1).toString(), 10)], 10);
            if (buttonIdlist.length > 1){
                buttonIndex = parseInt(buttonIdlist[parseInt((buttonIdlist.length - 2).toString(), 10)], 10);
            }
            subIndex = this.getNextSubIndex(mainTileElement.parentElement, buttonIndex);
            this.copyPage(pageOrder, mainTileElement);
            this.tileImageRender(buttonIndex, subIndex, pageOrder + 1, mainTileElement, true, false, false);
            this.updateTotalPageCount();
            this.updatePageNumber();
            this.disableTileDeleteButton();
            const clonedCollection : OrganizeDetails[] = [];
            clonedCollection.push(this.clonedCollection(this.tempOrganizePagesCollection.
                find((item: OrganizeDetails) => { return item.currentPageIndex === (pageOrder + 1); })));
            this.addOrganizeAction(clonedCollection, 'Copy', [], [], null, false);
        }
    }

    private deleteButtonClick = (event: MouseEvent): void => {
        if (this.pdfViewer.pageOrganizerSettings.canDelete) {
            const deleteButton: HTMLElement = event.currentTarget as HTMLElement;
            const mainTileElement: HTMLElement = deleteButton.closest('.e-pv-organize-anchor-node') as HTMLElement;
            const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
            const clonedCollection : OrganizeDetails[] = [];
            clonedCollection.push(this.clonedCollection(this.tempOrganizePagesCollection.
                find((item: OrganizeDetails) => { return item.currentPageIndex === pageOrder; })));
            this.addOrganizeAction(clonedCollection, 'Delete', [], [], null, false);
            this.deletePageElement(mainTileElement);
        }
        this.updateSelectAllCheckbox();
        this.enableDisableToolbarItems();

    }

    private deletePageElement(mainTileElement: HTMLElement): void {
        if (this.pdfViewer.pageOrganizerSettings.canDelete && this.tileAreaDiv.childElementCount > 1) {
            const pageOrder: number = parseInt(mainTileElement.getAttribute('data-page-order'), 10);
            this.deleteTempPage(pageOrder, mainTileElement);
            const deleteButton: HTMLButtonElement = mainTileElement.querySelector('.e-pv-delete-button') as HTMLButtonElement;
            if (!isNullOrUndefined(deleteButton) && !isNullOrUndefined((deleteButton as any).ej2_instances) &&
            (deleteButton as any).ej2_instances.length > 0) {
                // We are destroying the button component to remove tooltip
                (deleteButton as any).ej2_instances[0].destroy();
            }
            this.tileAreaDiv.removeChild(mainTileElement);
            this.updateTotalPageCount();
            this.updatePageNumber();
            this.updateSelectAllCheckbox();
            this.disableTileDeleteButton();
        }
    }

    private deleteTempPage(currentPageIndex: number, tileDiv: HTMLElement): void {
        if (this.pdfViewer.pageOrganizerSettings.canDelete &&
            (this.tempOrganizePagesCollection.filter((item: OrganizeDetails) => item.isDeleted === false).length > 0)) {
            const index: number =
            this.tempOrganizePagesCollection.findIndex((item: OrganizeDetails) => item.currentPageIndex === currentPageIndex);
            const delCurrentIndex: number = this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].currentPageIndex;
            if ( index !== -1 && !this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].isInserted &&
            !this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].isCopied) {
                this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].isDeleted = true;
                this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].currentPageIndex = null;
            }
            else {
                this.tempOrganizePagesCollection.splice(index, 1);
            }
            this.tempOrganizePagesCollection = this.tempOrganizePagesCollection.map((item: OrganizeDetails) => {
                if (delCurrentIndex < item.currentPageIndex && !item.isDeleted) {
                    item.currentPageIndex = item.currentPageIndex - 1;
                }
                return item;
            });

            while (!isNullOrUndefined(tileDiv.nextElementSibling)) {
                const nextTileDiv: HTMLElement = tileDiv.nextElementSibling as HTMLElement;
                let nextTileIndex: number = parseInt(nextTileDiv.getAttribute('data-page-order'), 10);
                nextTileIndex = nextTileIndex - 1;
                nextTileDiv.setAttribute('data-page-order', nextTileIndex.toString());
                tileDiv = nextTileDiv;
            }
        }
    }

    private undoDeletedPage(deletedPageIndex: number, pageIndex: number, rotateAngle: number, tileDiv: HTMLElement): void {
        if (this.tempOrganizePagesCollection.some((item: OrganizeDetails) => item.isDeleted)) {
            const deletedItem: OrganizeDetails = this.tempOrganizePagesCollection.find((item: OrganizeDetails) =>
                item.currentPageIndex === null && item.isDeleted && item.pageIndex !== -1 && item.pageIndex === pageIndex &&
                item.copiedPageIndex === null);
            if (deletedItem) {
                deletedItem.currentPageIndex = deletedPageIndex;
                deletedItem.rotateAngle = rotateAngle;
            }
        }
        this.tempOrganizePagesCollection = this.tempOrganizePagesCollection.map((item: OrganizeDetails) => {
            if (item.currentPageIndex >= deletedPageIndex && !item.isDeleted) {
                item.currentPageIndex += 1;
            }
            else if (item.currentPageIndex === deletedPageIndex && item.isDeleted) {
                item.isDeleted = false;
            }
            return item;
        });
        if (tileDiv) {
            tileDiv.setAttribute('data-page-order', (deletedPageIndex + 1).toString());
        }
        while (tileDiv && !isNullOrUndefined(tileDiv.nextElementSibling)) {
            const nextTileDiv: HTMLElement = tileDiv.nextElementSibling as HTMLElement;
            let nextTileIndex: number = parseInt(nextTileDiv.getAttribute('data-page-order'), 10);
            nextTileIndex += 1;
            nextTileDiv.setAttribute('data-page-order', nextTileIndex.toString());
            tileDiv = nextTileDiv;
        }
    }

    private insertRemovedPages(toolbarActions: OrganizeDetails, currentPageIndex: number, tileDiv: HTMLElement): void{
        let deleteCount: number = 0;
        for (let i: number = 0; i < currentPageIndex; i++) {
            if (this.tempOrganizePagesCollection[parseInt(i.toString(), 10)].isDeleted){
                deleteCount++;
            }
        }
        this.tempOrganizePagesCollection = this.tempOrganizePagesCollection.slice(0, currentPageIndex + deleteCount).
            concat(toolbarActions,
                   this.tempOrganizePagesCollection.slice(currentPageIndex + deleteCount));
        this.tempOrganizePagesCollection = this.tempOrganizePagesCollection.map((item: OrganizeDetails, mapIndex: number) => {
            if (mapIndex >= currentPageIndex) {
                item.currentPageIndex = mapIndex;
            }
            return item;
        });
        if (tileDiv) {
            tileDiv.setAttribute('data-page-order', (currentPageIndex + 1).toString());
        }
        while (tileDiv && !isNullOrUndefined(tileDiv.nextElementSibling)) {
            const nextTileDiv: HTMLElement = tileDiv.nextElementSibling as HTMLElement;
            let nextTileIndex: number = parseInt(nextTileDiv.getAttribute('data-page-order'), 10);
            nextTileIndex = nextTileIndex + 1;
            nextTileDiv.setAttribute('data-page-order', nextTileIndex.toString());
            tileDiv = nextTileDiv;
        }
    }

    private clonedCollection(tempCollecion: OrganizeDetails): OrganizeDetails{
        const clonedCollection: OrganizeDetails = JSON.parse(JSON.stringify(tempCollecion));
        return clonedCollection;
    }

    private updateTotalPageCount(): void {
        const totalPages: number = document.querySelectorAll('.e-pv-organize-anchor-node').length;
        const totalPageNumberElement: Element = document.querySelector('.e-pv-organize-total-page-button');
        if (!isNullOrUndefined(totalPageNumberElement)) {
            (totalPageNumberElement as HTMLElement).textContent = this.pdfViewer.localeObj.getConstant('Total') + ' ' + totalPages.toString() + ' ' + this.pdfViewer.localeObj.getConstant('Pages');
        }
    }

    private updatePageNumber(): void {
        const totalPages: any = document.querySelectorAll('.e-pv-organize-anchor-node');
        totalPages.forEach((element: any) => {
            const pageOrder: number = parseInt(element.getAttribute('data-page-order'), 10);
            const thumbnailPageNumber: HTMLElement = element.querySelector('.e-pv-tile-number') as HTMLElement;
            if (thumbnailPageNumber) {
                thumbnailPageNumber.textContent = (pageOrder + 1).toString();
            }
        });
        this.organizeWindowFocus();
    }

    private insertTempPage(currentPageIndex: number, isBefore: boolean, tileDiv: HTMLElement): void {
        if (this.pdfViewer.pageOrganizerSettings.canInsert) {
            const index: number =
            this.tempOrganizePagesCollection.findIndex((item: OrganizeDetails) => item.currentPageIndex === currentPageIndex);
            let beforeIndex: number;
            if (currentPageIndex !== 0) {
                beforeIndex =
                this.tempOrganizePagesCollection.findIndex((item: OrganizeDetails) => item.currentPageIndex === currentPageIndex - 1);
            }
            else {
                beforeIndex = index;
            }
            let pageIndex: number;
            let pageSize: any;
            if (isBefore) {
                pageIndex = this.tempOrganizePagesCollection[parseInt(beforeIndex.toString(), 10)].pageIndex;
                if (index - 1 >= 0 && !this.tempOrganizePagesCollection[parseInt((index - 1).toString(), 10)].isInserted) {
                    this.tempOrganizePagesCollection[parseInt((index - 1).toString(), 10)].hasEmptyPageAfter = true;
                }
                if (index <= this.tempOrganizePagesCollection.length - 1 &&
                     !this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].isInserted) {
                    this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].hasEmptyPageBefore = true;
                }
                pageSize = JSON.parse(JSON.stringify(this.tempOrganizePagesCollection[parseInt(beforeIndex.toString(), 10)].pageSize));
                if (pageIndex !== -1) {
                    if (!isNullOrUndefined(pageSize.rotation) &&
                     (this.getRotatedAngle(pageSize.rotation.toString()) === 90 ||
                     this.getRotatedAngle(pageSize.rotation.toString()) === 270)) {
                        const swapWidth: any = pageSize.width;
                        pageSize.width = pageSize.height;
                        pageSize.height = swapWidth;
                    }
                }
                this.tempOrganizePagesCollection = [...this.tempOrganizePagesCollection.slice(0, index),
                    new OrganizeDetails(currentPageIndex, -1,
                                        this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].pageIndex,
                                        true, false, false, false, false, false,
                                        this.tempOrganizePagesCollection[parseInt(beforeIndex.toString(), 10)].rotateAngle, pageSize),
                    ...this.tempOrganizePagesCollection.slice(index)];
                this.tempOrganizePagesCollection = this.tempOrganizePagesCollection.map((item: OrganizeDetails, mapIndex: number) => {
                    if ((mapIndex !== index && item.currentPageIndex >= currentPageIndex) && item.currentPageIndex != null) {
                        item.currentPageIndex = item.currentPageIndex + 1;
                    }
                    return item;
                });
                tileDiv.setAttribute('data-page-order', (currentPageIndex + 1).toString());
            }
            else {
                pageIndex = this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].pageIndex;
                if (index >= 0 && !this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].isInserted) {
                    this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].hasEmptyPageAfter = true;
                }
                if (index + 1 <= this.tempOrganizePagesCollection.length - 1 &&
                    !this.tempOrganizePagesCollection[parseInt((index + 1).toString(), 10)].isInserted) {
                    this.tempOrganizePagesCollection[parseInt((index + 1).toString(), 10)].hasEmptyPageBefore = true;
                }
                pageSize = JSON.parse(JSON.stringify(this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].pageSize));
                if (pageIndex !== -1) {
                    if (!isNullOrUndefined(pageSize.rotation) &&
                    (this.getRotatedAngle(pageSize.rotation.toString()) === 90 ||
                    this.getRotatedAngle(pageSize.rotation.toString()) === 270)) {
                        const swapWidth: any = pageSize.width;
                        pageSize.width = pageSize.height;
                        pageSize.height = swapWidth;
                    }
                }
                this.tempOrganizePagesCollection = [...this.tempOrganizePagesCollection.slice(0, index + 1),
                    new OrganizeDetails(currentPageIndex + 1, -1,
                                        this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].pageIndex, true, false,
                                        false, false, false, false, 
                                        this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].rotateAngle, pageSize),
                    ...this.tempOrganizePagesCollection.slice(index + 1)];
                this.tempOrganizePagesCollection = this.tempOrganizePagesCollection.map((item: OrganizeDetails, mapIndex: number) => {
                    if ((mapIndex !== index + 1 && item.currentPageIndex >= currentPageIndex + 1) && item.currentPageIndex != null) {
                        item.currentPageIndex = item.currentPageIndex + 1;
                    }
                    return item;
                });
            }
            while (!isNullOrUndefined(tileDiv.nextElementSibling)) {
                const nextTileDiv: HTMLElement = tileDiv.nextElementSibling as HTMLElement;
                let nextTileIndex: number = parseInt(nextTileDiv.getAttribute('data-page-order'), 10);
                nextTileIndex = nextTileIndex + 1;
                nextTileDiv.setAttribute('data-page-order', nextTileIndex.toString());
                tileDiv = nextTileDiv;
            }
        }
    }

    private copyPage(currentPageIndex: number, tileDiv: HTMLElement): void {
        if (this.pdfViewer.pageOrganizerSettings.canCopy) {
            const index: number = this.tempOrganizePagesCollection.findIndex((item: OrganizeDetails) => {
                return item.currentPageIndex === currentPageIndex; });
            let pageIndex: number;
            let pageSize;
            if (index !== -1) {
                pageIndex = this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].pageIndex;
                pageSize = JSON.parse(JSON.stringify(this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].pageSize));
                if (pageIndex !== -1) {
                    if (!isNullOrUndefined(pageSize.rotation) && (this.getRotatedAngle(pageSize.rotation.toString()) == 90 ||
                    this.getRotatedAngle(pageSize.rotation.toString()) === 270)) {
                        const swapWidth = pageSize.width;
                        pageSize.width = pageSize.height;
                        pageSize.height = swapWidth;
                    }
                }

                if (pageIndex === -1 && this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].isCopied){
                    this.tempOrganizePagesCollection = this.tempOrganizePagesCollection.slice(0, index + 1).
                        concat([new OrganizeDetails(currentPageIndex + 1, -1,
                                                    this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].copiedPageIndex,
                                                    false, false, true, false, false, false,
                                                    this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].
                                                        rotateAngle, pageSize)],
                               this.tempOrganizePagesCollection.slice(index + 1));
                }
                else{
                    this.tempOrganizePagesCollection = this.tempOrganizePagesCollection.slice(0, index + 1).
                        concat([new OrganizeDetails(currentPageIndex + 1, -1, pageIndex,
                                                    false, false, true, false, false, false,
                                                    this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].
                                                        rotateAngle, pageSize)],
                               this.tempOrganizePagesCollection.slice(index + 1));
                }
                this.tempOrganizePagesCollection[parseInt(index.toString(), 10)].istargetCopied = true;
                this.tempOrganizePagesCollection = this.tempOrganizePagesCollection.map((item: OrganizeDetails, mapIndex: number) => {
                    if (mapIndex > index + 1 && item.currentPageIndex != null) {
                        item.currentPageIndex = item.currentPageIndex + 1;
                    }
                    return item;
                });
                while (!isNullOrUndefined(tileDiv.nextElementSibling)) {
                    const nextTileDiv: HTMLElement = tileDiv.nextElementSibling as HTMLElement;
                    let nextTileIndex: number = parseInt(nextTileDiv.getAttribute('data-page-order'), 10);
                    nextTileIndex = nextTileIndex + 1;
                    nextTileDiv.setAttribute('data-page-order', nextTileIndex.toString());
                    tileDiv = nextTileDiv;
                }
            }
        }
    }

    private updateOrganizePageCollection(): void {
        this.organizePagesCollection = JSON.parse(JSON.stringify(this.tempOrganizePagesCollection));
    }

    /**
     *
     * @param {any} pageCanvas - It describes about the page canvas
     * @param {number} pageNumber - It describes about the page number
     * @private
     * @returns {void}
     */
    public applyElementStyles(pageCanvas: any, pageNumber: number): void {
        if (pageCanvas) {
            const canvasElement: HTMLElement = document.getElementById(this.pdfViewer.element.id + '_pageCanvas_' + pageNumber);
            const oldCanvas: HTMLElement = document.getElementById(this.pdfViewer.element.id + '_oldCanvas_' + pageNumber);
            if (canvasElement && canvasElement.offsetLeft > 0) {
                // Update marginLeft, marginRight, and top positions
                const offsetLeft: number = canvasElement.offsetLeft;
                const offsetTop: number = canvasElement.offsetTop;
                pageCanvas.style.marginLeft = offsetLeft + 'px';
                pageCanvas.style.marginRight = offsetLeft + 'px';
                pageCanvas.style.top = offsetTop + 'px';
            } else if (oldCanvas && oldCanvas.offsetLeft > 0) {
                // Update marginLeft, marginRight, and top positions using oldCanvas
                const offsetLeft: number = oldCanvas.offsetLeft;
                const offsetTop: number = oldCanvas.offsetTop;
                pageCanvas.style.marginLeft = offsetLeft + 'px';
                pageCanvas.style.marginRight = offsetLeft + 'px';
                pageCanvas.style.top = offsetTop + 'px';
            } else {
                // Reset the positions
                pageCanvas.style.marginLeft = 'auto';
                pageCanvas.style.marginRight = 'auto';
                pageCanvas.style.top = 'auto';
            }
        }
    }

    private onSaveasClicked(): void {
        if (JSON.stringify(this.tempOrganizePagesCollection) !== JSON.stringify(this.organizePagesCollection)) {
            this.updateOrganizePageCollection();
            this.isDocumentModified = true;
            this.pdfViewerBase.updateDocumentEditedProperty(true);
        }
        const fileName: string = this.pdfViewer.fileName;
        let pdfBlob: Blob;
        let canDownload: boolean = false;
        const temp: any = JSON.parse(JSON.stringify(this.organizePagesCollection));
        this.pdfViewer.saveAsBlob().then((blob: Blob) => {
            pdfBlob = blob;
            this.blobToBase64(pdfBlob).then((base64: string) => {
                if (!isNullOrUndefined(base64) && base64 !== '') {
                    canDownload = this.pdfViewer.firePageOrganizerSaveAsEventArgs(fileName, base64);
                    if (canDownload) {
                        this.pdfViewerBase.download();
                        this.organizePagesCollection = JSON.parse(JSON.stringify(temp));
                    }
                }
            });
        });
    }

    /**
     *
     * Rotates all pages in the PDF Viewer by the specified angle.
     *
     * @param {PdfPageRotateAngle} pageRotateAngle - The angle by which to rotate the pages (PdfPageRotateAngle).
     *                          The rotation can be 0, 90, 180, or 270 degrees.
     * @returns {void}
     * @private
     */
    public rotateAllPages(pageRotateAngle: PdfPageRotateAngle): void {
        if (this.pdfViewer.pageOrganizerSettings.canRotate) {
            const rotateAngle: PdfPageRotateAngle = pageRotateAngle as PdfPageRotateAngle;
            // Get the total page count
            const totalPages: number = this.pdfViewer.pageCount;
            // Generate an array of page indexes
            const pageIndexes : number[] = Array.from({ length: totalPages }, (_: any, index: number) => index);
            this.processRotation(pageIndexes, rotateAngle);
        }
    }

    /**
     * Rotates the specified pages in the PDF Viewer by the specified angle.
     *
     * @param {number} pageIndexes - The array of page indexes to rotate.
     * @param {PdfPageRotateAngle} pageRotateAngle - The angle by which to rotate the pages (PdfPageRotateAngle).
     *                          The rotation can be 0, 90, 180, or 270 degrees.
     * @returns {void}
     * @private
     */
    public rotatePages(pageIndexes: number[], pageRotateAngle: PdfPageRotateAngle): void;

    /**
     * @private
     * @returns {void}
     */
    public rotatePages(pageStartIndex: number, pageEndIndex: number, pageRotateAngle: PdfPageRotateAngle): void;

    /**
     * @private
     * @returns {void}
     */
    public rotatePages(pageRotations: PageRotation[]): void;

    /**
     * @param {number} arg1 - It describes about the arg1
     * @param {number} arg2 - It describes about the arg2
     * @private
     * @returns {void}
     */
    public rotatePages(arg1: number | number[] | PageRotation[], arg2?: number | PdfPageRotateAngle): void {
        if (this.pdfViewer.pageOrganizerSettings.canRotate) {
            if (Array.isArray(arg1)) {
                // Check if the second argument is provided and is of type PdfPageRotateAngle
                if (arg2 !== undefined && typeof arg2 === 'number') {
                    const pageIndexes: number[] = arg1 as number[];
                    const rotateAngle: PdfPageRotateAngle = arg2 as PdfPageRotateAngle;
                    this.processRotation(pageIndexes, rotateAngle);
                } else {
                    // Handle case: RotatePages(pageRotations: PageRotation[])
                    const pageRotations: PageRotation[] = arg1 as PageRotation[];
                    for (const pageRotation of pageRotations) {
                        this.processRotation([pageRotation.pageIndex], pageRotation.rotationAngle);
                    }
                }
            }
            else if (typeof arg1 === 'number' && typeof arg2 === 'number') {
                // Handle case: RotatePages(pageStartIndex, pageEndIndex, PdfPageRotateAngle.RotateAngle90)
                const pageStartIndex: number = arg1 as number;
                const pageEndIndex: number = arg2 as number;
                // eslint-disable-next-line
                const rotateAngle: PdfPageRotateAngle = arguments[2] as PdfPageRotateAngle;
                this.processRotation(this.generateRange(pageStartIndex, pageEndIndex), rotateAngle);
            }
        }
    }

    private processRotation(pageIndexes: number[], pageRotateAngle: PdfPageRotateAngle): void {
        if (this.pdfViewer.pageOrganizerSettings.canRotate) {
            // Iterate through the provided page numbers
            for (const pageIndex of pageIndexes) {
                const rotateAngle: number = this.pdfRotateAngle(pageRotateAngle);
                // Find the index of the page in the rotationDetail array
                const index: number = this.organizePagesCollection.findIndex((item: PageDetails) => item.pageIndex === pageIndex);
                // Check if the page is already in the rotationDetail array
                if (index !== -1) {
                    // If the pageIndex is found in the array, update the rotation angle
                    this.organizePagesCollection[parseInt(index.toString(), 10)].rotateAngle =
                    (this.organizePagesCollection[parseInt(index.toString(), 10)].rotateAngle + rotateAngle + 360) % 360;
                }
            }
        }
    }

    private generateRange(start: number, end: number): number[] {
        return Array.from({ length: end - start + 1 }, (_: any, index: number) => start + index);
    }

    private pdfRotateAngle(rotateAngle: PdfPageRotateAngle): number {
        let angle: number = 0;
        if (rotateAngle === PdfPageRotateAngle.RotateAngle0) {
            angle = 0;
        }
        else if (rotateAngle === PdfPageRotateAngle.RotateAngle90) {
            angle = 90;
        }
        else if (rotateAngle === PdfPageRotateAngle.RotateAngle180) {
            angle = 180;
        }
        else if (rotateAngle === PdfPageRotateAngle.RotateAngle270) {
            angle = 270;
        }
        else if (rotateAngle === PdfPageRotateAngle.RotateAngle360) {
            angle = 0;
        }
        return angle;
    }

    private createTooltip(toolbarItem: HTMLElement, tooltipText: string): void {
        if (tooltipText !== null) {
            const tooltip: Tooltip = new Tooltip({
                content: initializeCSPTemplate(
                    function (): string { return tooltipText; }
                ), opensOn: 'Hover', beforeOpen: this.onTooltipBeforeOpen.bind(this)
            });
            tooltip.appendTo(toolbarItem);
        }
    }

    /**
     * Rotates the specified pages clockwise by 90 degrees.
     *
     * @param {number} pageNumbers - Array of page numbers to rotate.
     * @private
     * @returns {void}
     */
    public rotateClockwise(pageNumbers: number[]): void {
        if (this.pdfViewer.pageOrganizerSettings.canRotate) {
            // Iterate through the provided page numbers
            for (const pageIndex of pageNumbers) {
                // Find the index of the page in the rotationDetail array
                const index: number = this.organizePagesCollection.findIndex((item: PageDetails) => item.pageIndex === pageIndex);
                // Check if the page is already in the rotationDetail array
                if (index !== -1) {
                    // If the pageIndex is found in the array, update the rotation angle
                    this.organizePagesCollection[parseInt(index.toString(), 10)].rotateAngle =
                    (this.organizePagesCollection[parseInt(index.toString(), 10)].rotateAngle + 90 + 360) % 360;
                }
            }
        }
    }

    /**
     * Rotates the specified pages counterclockwise by 90 degrees.
     *
     * @param {number} pageNumbers - Array of page numbers to rotate.
     * @private
     * @returns {void}
     */
    public rotateCounterclockwise(pageNumbers: number[]): void {
        if (this.pdfViewer.pageOrganizerSettings.canRotate) {
            // Iterate through the provided page numbers
            for (const pageIndex of pageNumbers) {
                // Find the index of the page in the rotationDetail array
                const index: number = this.organizePagesCollection.findIndex((item: PageDetails) => item.pageIndex === pageIndex);
                // Check if the page is already in the rotationDetail array
                if (index !== -1) {
                    // If the pageIndex is found in the array, update the rotation angle
                    this.organizePagesCollection[parseInt(index.toString(), 10)].rotateAngle =
                     (this.organizePagesCollection[parseInt(index.toString(), 10)].rotateAngle - 90 + 360) % 360;
                }
            }
        }
    }

    /**
     * Opens the page organizer dialog within the Pdf Viewer, allowing for management of PDF pages.
     *
     * ```html
     * <div id="pdfViewer" style="height: 100%;width: 100%;"></div>
     * ```
     * ```ts
     * let viewer: PdfViewer = new PdfViewer();
     * viewer.appendTo("#pdfViewer");
     * viewer.documentLoad = () => {
     *      viewer.pageOrganizer.openPageOrganizer();
     * }
     * ```
     *
     * @returns {void}
     */
    public openPageOrganizer(): void {
        if (!isNullOrUndefined(this.pdfViewer.pageOrganizer)) {
            if (this.isAllImagesReceived) {
                if (!Browser.isDevice || this.pdfViewer.enableDesktopMode) {
                    this.createOrganizeWindow();
                }
                else {
                    this.createOrganizeWindowForMobile();
                }
            }
        }
        else {
            this.pdfViewerBase.getModuleWarningMessage('PageOrganizer');
        }
    }

    /**
     * Closes the currently open page organizer dialog within the PDF Viewer, if present.
     *
     * ```html
     * <div id="pdfViewer" style="height: 100%;width: 100%;"></div>
     * ```
     * ```ts
     * let viewer: PdfViewer = new PdfViewer();
     * viewer.appendTo("#pdfViewer");
     * viewer.documentLoad = () => {
     *      viewer.pageOrganizer.closePageOrganizer();
     * }
     * ```
     *
     * @returns {void}
     */
    public closePageOrganizer(): void {
        if (!isNullOrUndefined(this.pdfViewer.pageOrganizer)) {
            if (!isNullOrUndefined(this.organizeDialog)) {
                this.organizeDialog.hide();
            }
        }
        else {
            this.pdfViewerBase.getModuleWarningMessage('PageOrganizer');
        }
    }

    /**
     * @private
     * @returns {void}
     */
    public switchPageOrganizer(): void {
        if (!isNullOrUndefined(this.pdfViewer.pageOrganizer)) {
            if (!isNullOrUndefined(this.organizeDialog) && this.organizeDialog.visible) {
                this.closePageOrganizer();
            } else {
                this.openPageOrganizer();
            }
        }
    }

    /**
     * @private
     * @returns {void}
     */
    public getModuleName(): string {
        return 'PageOrganizer';
    }

    private destroyDialogWindow(): void {
        if (!isNullOrUndefined(this.organizeDialog)) {
            this.organizeDialog.destroy();
            this.organizeDialog = null;
        }
        const dialogElement: HTMLElement = this.pdfViewerBase.getElement('_organize_window');
        if (!isNullOrUndefined(dialogElement)) {
            dialogElement.parentElement.removeChild(dialogElement);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    public clear(): void {
        if (!isNullOrUndefined(this.pdfViewerBase.navigationPane)) {
            this.pdfViewerBase.navigationPane.enableOrganizeButton(false);
        }
        if (!isNullOrUndefined(this.pdfViewer.toolbar)) {
            this.pdfViewer.toolbar.enableToolbarItem(['OrganizePagesTool'], false);
        }
        this.destroyDialogWindow();
        this.organizePagesCollection = [];
        this.tempOrganizePagesCollection = [];
        this.undoOrganizeCollection = [];
        this.redoOrganizeCollection = [];
        this.isDocumentModified = false;
        this.mobileContextMenu = [];
        this.dataDetails = [];
    }

    /**
     * @private
     * @returns {void}
     */
    public destroy(): boolean {
        return true;
    }

}

/**
 * Enum for PdfPageRotateAngle
 */
export enum PdfPageRotateAngle {
    RotateAngle0 = 1,
    RotateAngle90 = 2,
    RotateAngle180 = 3,
    RotateAngle270 = 4,
    RotateAngle360 = 1
}

export class PageRotation {
    // eslint-disable-next-line
    constructor(public pageIndex: number, public rotationAngle: PdfPageRotateAngle) {}
}

/**
 * Interface representing details about a page, including rotation angle and page index.
 *
 * @hidden
 */
export interface PageDetails {
    rotateAngle: number;
    pageIndex: number;
}

/**
 * Interface representing details about organizing pages, including page ID, current page index, rotate angle, and status of insertion and deletion.
 */
export class OrganizeDetails {
    currentPageIndex: number;
    pageIndex: number;
    copiedPageIndex: number;
    isInserted: boolean;
    isDeleted: boolean;
    isCopied: boolean;
    istargetCopied: boolean;
    hasEmptyPageAfter: boolean;
    hasEmptyPageBefore: boolean;
    rotateAngle: number;
    pageSize: ISize;
    constructor(currentPageIndex: number, pageIndex: number, copiedPageIndex: number, isInserted: boolean,
                isDeleted: boolean, isCopied: boolean, istargetCopied: boolean, hasEmptyPageAfter: boolean,
                hasEmptyPageBefore: boolean, rotateAngle: number, pageSize: ISize) {
        this.currentPageIndex = currentPageIndex;
        this.pageIndex = pageIndex;
        this.copiedPageIndex = copiedPageIndex;
        this.isInserted = isInserted;
        this.isDeleted = isDeleted;
        this.isCopied = isCopied;
        this.istargetCopied = istargetCopied;
        this.hasEmptyPageAfter = hasEmptyPageAfter;
        this.hasEmptyPageBefore = hasEmptyPageBefore;
        this.rotateAngle = rotateAngle;
        this.pageSize = pageSize;
    }
}