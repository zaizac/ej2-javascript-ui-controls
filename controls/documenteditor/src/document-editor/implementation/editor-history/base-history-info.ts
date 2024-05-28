import { WParagraphFormat, WTabStop } from '../format/paragraph-format';
import { WSectionFormat } from '../format/section-format';
import { WCharacterFormat } from '../format/character-format';
import { WListFormat } from '../format/list-format';
import { WListLevel } from '../list/list-level';
import { Editor, EditorHistory, Selection, Revision, HistoryInfo, CommentView, WList } from '../index';
import { ModifiedLevel, RowHistoryFormat, TableHistoryInfo, EditRangeInfo } from './history-helper';
import {
    IWidget, BlockWidget,
    ParagraphWidget, LineWidget, BodyWidget, TableCellWidget,
    FieldElementBox, TableWidget, TableRowWidget, BookmarkElementBox, HeaderFooterWidget,
    EditRangeStartElementBox, CommentElementBox, CheckBoxFormField, TextFrame, TextFormField, TextElementBox, HeaderFooters, CommentEditInfo, FormField, FootnoteElementBox, ImageElementBox, Widget
} from '../viewer/page';
import { Dictionary } from '../../base/dictionary';
import { DocumentEditor } from '../../document-editor';
import { Action, abstractListsProperty, listIdProperty, listsProperty, nsidProperty } from '../../index';
import { TextPosition, ImageSizeInfo } from '../index';
import { LayoutViewer } from '../index';
import { isNullOrUndefined } from '@syncfusion/ej2-base';
import { ElementBox, CommentCharacterElementBox } from '../viewer/page';
import { TableResizer } from '../editor/table-resizer';
import { WTableFormat, WRowFormat, WCellFormat, WParagraphStyle, WCharacterStyle, WShading, WBorders} from '../format/index';
import { ParagraphInfo, HelperMethods, AbsolutePositionInfo, CellInfo, PositionInfo } from '../editor/editor-helper';
import { BookmarkInfo } from './history-helper';
import { DocumentHelper, TextHelper } from '../viewer';
import { CONTROL_CHARACTERS, HeaderFooterType, ListLevelPattern, ProtectionType } from '../../base/types';

import { WBorder } from '../../index';

// Code for Comparing the offset calculated using old approach and optimized approach
// /**
//  * @private
//  */
// export class MyError extends Error {
//     constructor(message: string) {
//         super(message);
//     }
// }

// export function throwCustomError(condition: boolean, message: string) {
//     if (condition) {
//         throw new MyError(message);
//     }
// }

/**
 * @private
 */
export class BaseHistoryInfo {
    // Fields
    private ownerIn: DocumentEditor;
    public documentHelper: DocumentHelper;
    private actionIn: Action;
    private removedNodesIn: IWidget[];
    private modifiedPropertiesIn: Object[];
    private modifiedNodeLength: number[];
    private selectionStartIn: string;
    private selectionEndIn: string;
    private insertPositionIn: string;
    private endPositionIn: string;
    private currentPropertyIndex: number;
    private ignoredWord: string;
    public insertedText: string;
    public insertedData: ImageInfo;
    public type: string;
    public headerFooterStart: number;
    public headerFooterEnd: number;
    private tableRelatedLength: number;
    public cellOperation: Operation[] = [];
    public format: string;

    public fieldBegin: FieldElementBox;
    public startIndex: number;
    private insertIndex: number;
    public endIndex: number;
    public ignoreStartOffset: boolean;
    public insertedElement: ElementBox;
    public splittedRevisions: MarkerInfo[] = [];
    public isAcceptOrReject: string;
    public insertedNodes: IWidget[];
    public pasteContent: string;
    public insertedFormat: Object;
    private collabStart: string;
    private collabEnd: string;
    public isRemovedNodes: boolean = false;
    public modifiedFormatOperation: Operation[] = [];
    private revisionOperation: Operation[] = [];

    // Code for Comparing the offset calculated using old approach and optimized approach
    // private newInsertIndex: number;
    // private newStartIndex: number;
    // private newEndIndex: number;


    /**
     * @private
     */
    public lastElementRevision: ElementBox;
    /**
     * @private
     */
    public endRevisionLogicalIndex: string;
    /**
     * @private
     */
    public markerData: MarkerInfo[] = [];
	/**
     * @private
     */
    public formFieldType: string;
    /**
     * @private
     */
    public isEditHyperlink: boolean;
    /**
     * @private
     */
    public isHyperlinkField: boolean;
    /**
     * @private
     */
    public dropDownIndex: number;
    //Properties
    //gets owner control
    public get owner(): DocumentEditor {
        return this.ownerIn;
    }

    public get editorHistory(): EditorHistory {
        return this.owner.editorHistoryModule;
    }
    public get action(): Action {
        return this.actionIn;
    }
    public set action(value: Action) {
        this.actionIn = value;
        if (this.owner.enableCollaborativeEditing && !this.editorHistory.isUndoing && this.cellOperation.length == 0) {
            if (value === 'DeleteColumn' || value === 'DeleteCells' || value === 'ClearCells' || value === 'MergeCells') {
                if (!(this.owner.selectionModule.isTableSelected(true) || this.owner.selectionModule.isRowSelect()) || value === 'ClearCells' || value === 'MergeCells') {
                    this.insertedText = CONTROL_CHARACTERS.Cell;
                    this.deleteColumnOperation(this.action);
                }
            } else if (value === 'Accept Change' || value === 'Reject Change') {
                this.createAcceptRejectOperation(this.action);
            } else if (value === 'SectionBreak') {
                this.insertedText = CONTROL_CHARACTERS.Section_Break;
                this.type = "NewPage";
            } else if (value === 'SectionBreakContinuous') {
                this.insertedText = CONTROL_CHARACTERS.Section_Break;
                this.type = "Continuous";
            }
        }
    }

    public get modifiedProperties(): Object[] {
        return this.modifiedPropertiesIn;
    }
    /* eslint-enable */
    public get removedNodes(): IWidget[] {
        return this.removedNodesIn;
    }
    //gets or sets selection start
    public get selectionStart(): string {
        return this.selectionStartIn;
    }
    public set selectionStart(value: string) {
        this.selectionStartIn = value;
    }
    public get selectionEnd(): string {
        return this.selectionEndIn;
    }
    public set selectionEnd(value: string) {
        this.selectionEndIn = value;
    }

    public get insertPosition(): string {
        return this.insertPositionIn;
    }
    public set insertPosition(value: string) {
        this.insertPositionIn = value;
        if (this.owner.enableCollaborativeEditing && !this.owner.editorModule.isRemoteAction && value !== '' && !isNullOrUndefined(value) && value.indexOf('C') === -1) {
            //TODO: Insert position not needed in all the cases. Need to optimize it.
            this.insertIndex = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(value);
            
            // Code for Comparing the offset calculated using old approach and optimized approach
            // this.owner.selection.isNewApproach = true;
            // this.newInsertIndex = this.owner.selection.getAbsolutePositionFromRelativePosition(value);
            // this.owner.selection.isNewApproach = false;
            // throwCustomError(this.newInsertIndex !== this.insertIndex, "New InsertIndex " + this.newInsertIndex + " and old insertIndex " + this.insertIndex + " doesnot match");
        }
    }
    public get endPosition(): string {
        return this.endPositionIn;
    }
    public set endPosition(value: string) {
        this.endPositionIn = value;
    }
    public constructor(node: DocumentEditor) {
        this.ownerIn = node;
        this.documentHelper = node.documentHelper;
        this.modifiedPropertiesIn = [];
        this.modifiedNodeLength = [];
        this.removedNodesIn = [];
        this.insertedNodes = [];
    }
    private get viewer(): LayoutViewer {
        return this.ownerIn.viewer;
    }

    public updateSelection(): void {
        this.updateCollaborativeSelection(this.owner.selectionModule.start.clone(), this.owner.selectionModule.end.clone());
        let blockInfo: ParagraphInfo = this.owner.selectionModule.getParagraphInfo(this.owner.selectionModule.start);
        this.selectionStart = this.owner.selectionModule.getHierarchicalIndex(blockInfo.paragraph, blockInfo.offset.toString());
        blockInfo = this.owner.selectionModule.getParagraphInfo(this.owner.selectionModule.end);
        this.selectionEnd = this.owner.selectionModule.getHierarchicalIndex(blockInfo.paragraph, blockInfo.offset.toString());
    }

    private updateCollaborativeSelection(start: TextPosition, end: TextPosition): void {
        if (this.owner.enableCollaborativeEditing && !this.owner.editorModule.isRemoteAction) {
            //TODO: Need to consider formard and backward selection
            if (this.action == 'RemoveEditRange') {
                let startEdit: EditRangeStartElementBox = this.owner.selectionModule.getEditRangeStartElement();
                let position: PositionInfo = this.owner.selectionModule.getPosition(startEdit);
                start = position.startPosition;
                end = position.endPosition;
            } else {
                this.updateTableSelection(start, end);
            }
            this.startIndex = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(start);
            
            // Code for Comparing the offset calculated using old approach and optimized approach
            // this.owner.selection.isNewApproach = true;
            // this.newStartIndex = this.owner.selection.getAbsolutePositionFromRelativePosition(start);
            // this.owner.selection.isNewApproach = false;
            
            this.owner.selectionModule.isEndOffset = true;
            this.endIndex = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(end);
            
            // Code for Comparing the offset calculated using old approach and optimized approach
            // this.owner.selection.isNewApproach = true;
            // this.newEndIndex = this.owner.selection.getAbsolutePositionFromRelativePosition(end);
            // this.owner.selection.isNewApproach = false;
            this.owner.selectionModule.isEndOffset = false;
            let isForward: boolean = this.owner.selectionModule.isForward;
            if (isForward) {
                this.startIndex -= this.owner.selectionModule.getTableRelativeValue(start, end);
            } else {
                this.endIndex -= this.owner.selectionModule.getTableRelativeValue(end, start);
            }
            // if (this.action === 'BackSpace' || this.action === 'Delete') {
                let isParagraphStart: boolean = isForward ? (start.paragraph.equals(end.paragraph) && start.isAtParagraphStart) : (start.paragraph.equals(end.paragraph) && end.isAtParagraphStart);
                if ((isParagraphStart || !start.paragraph.equals(end.paragraph))) {
                    if (isForward) {
                        this.endIndex += this.paraInclude(end);
                    } else {
                        this.startIndex += this.paraInclude(start);
                    }
                }
            // }
            if(!this.owner.enableTrackChanges) {
                this.splitOperationForDelete(start, end);
            }
            // Code for Comparing the offset calculated using old approach and optimized approach
            // throwCustomError(this.newStartIndex !== this.startIndex, "New StartIndex " + this.newStartIndex + " and old StartIndex " + this.startIndex + " doesnot match");
            // throwCustomError(this.newEndIndex !== this.endIndex, "New EndIndex " + this.newEndIndex + " and old EndIndex " + this.endIndex + " doesnot match");
        }
    }
    private paraInclude(position: TextPosition): number {
        let paragrapthInfo: ParagraphInfo = this.owner.selectionModule.getParagraphInfo(position);
        if (position.paragraph.getTotalLength() < paragrapthInfo.offset) {
            if (!(position.paragraph.isInsideTable && position.paragraph.equals(position.paragraph.associatedCell.lastChild as ParagraphWidget))) {
                return 1;
            }
        }
        return 0;
    }
    /**
     * This method will set position when the multple cell selected. 
     */
    private updateTableSelection(startPosition: TextPosition, endPosition: TextPosition): void {
        let start = startPosition;
        let end = endPosition;
        if (!this.owner.selectionModule.isForward) {
            start = endPosition;
            end = startPosition;
        }
        if (start.paragraph.isInsideTable) {
            const firstPara: ParagraphWidget = this.owner.selectionModule.getFirstParagraph(start.paragraph.associatedCell);
            if (end.paragraph.isInsideTable) {
                if (!start.paragraph.associatedCell.equals(end.paragraph.associatedCell)) {
                    const lastPara: ParagraphWidget = this.owner.selectionModule.getLastParagraph(end.paragraph.associatedCell);
                    start.setPosition(firstPara.firstChild as LineWidget, true);
                    end.setPositionParagraph(lastPara.lastChild as LineWidget, (lastPara.lastChild as LineWidget).getEndOffset() + 1);
                }
            } else {
                start.setPosition(firstPara.firstChild as LineWidget, true);
            }
        } else if (end.paragraph.isInsideTable) {
            const lastPara: ParagraphWidget = this.owner.selectionModule.getLastParagraph(end.paragraph.associatedCell);
            end.setPositionParagraph(lastPara.lastChild as LineWidget, (lastPara.lastChild as LineWidget).getEndOffset() + 1);
        }
    }
    /**
     * start is para and end is in row. 
     */
    private splitOperationForDelete(startPosition: TextPosition, endPosition: TextPosition) {
        // when start is para and end is row. we are building the operation like: 
        // fisrt delete the end table from table start to selection end.
        // second need to paste the content from the start para and need to paste it in the next row.
        // third delete the start paragraph to before wiget of end table. 
        let start: TextPosition = startPosition;
        let end: TextPosition = endPosition;
        if (!this.owner.selectionModule.isForward) {
            start = endPosition;
            end = startPosition;
        }
        if (!start.paragraph.isInsideTable && end.paragraph.isInsideTable && (this.action === 'BackSpace' || this.action === 'Delete')) {
            let lastParagraph: ParagraphWidget = this.owner.selectionModule.getLastBlockInLastCell(end.paragraph.associatedCell.ownerTable) as ParagraphWidget;
            if (!lastParagraph.associatedCell.equals(end.paragraph.associatedCell)) {
                let PasteLength = this.startIndex;
                let endLineWidget: LineWidget = start.currentWidget;
                let endOffset: number = start.offset;
                start.setPosition(start.paragraph.firstChild as LineWidget, true);
                this.startIndex = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(start);
                let startIndex: number = this.startIndex;
                let table: TableWidget = this.owner.documentHelper.layout.getParentTable(end.paragraph.associatedCell.ownerTable);
                let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
                let tableStart: number = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, table).position;
                // Table start will get the offset for table. So adding plus one to row offset.
                this.startIndex = tableStart + 1;
                this.cellOperation.push(this.getDeleteOperation(this.action));
                // This will add the paste content in first and first cell so adding plus 3. 
                this.startIndex = tableStart + 3;
                if (endOffset !== 0) {
                    this.pasteContent = this.owner.sfdtExportModule.write((this.owner.documentEditorSettings.optimizeSfdt ? 1 : 0), start.currentWidget, start.offset, endLineWidget, endOffset, false, true);
                    this.cellOperation.push(this.getPasteOpertion(this.pasteContent, PasteLength - startIndex));
                }
                this.endIndex = tableStart;
                this.startIndex = startIndex;
                this.cellOperation.push(this.getDeleteOperation(this.action));
            }
        }
        if(this.action === 'PasteColumn' || this.action === 'PasteOverwrite' || this.action === 'PasteRow') {
            //when inserting new colomn in paste. first deleting the table and inserting the whole table.
            let table: TableWidget = startPosition.paragraph.associatedCell.ownerTable
            let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
            this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, table).position;
            this.endIndex = this.startIndex + this.owner.selectionModule.getBlockLength(undefined, table, 0, { done: false }, true, undefined, undefined);
        }
    }
    public setBookmarkInfo(bookmark: BookmarkElementBox): void {
        this.removedNodes.push({ 'bookmark': bookmark, 'startIndex': bookmark.indexInOwner, 'endIndex': bookmark.reference.indexInOwner });
    }
    public setFormFieldInfo(field: FieldElementBox, value: string | number | boolean): void {
        this.removedNodes.push({ 'formField': field, 'value': value });
    }
    public setEditRangeInfo(editStart: EditRangeStartElementBox): void {
        this.removedNodes.push({ 'editStart': editStart, 'startIndex': editStart.indexInOwner, 'endIndex': editStart.editRangeEnd.indexInOwner });
    }
    private revertFormTextFormat(): void {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const fieldInfo: any = this.removedNodes[0];
        let text: any = fieldInfo.value;
        /* eslint-enable @typescript-eslint/no-explicit-any */
        const formField: FieldElementBox = fieldInfo.formField;
        if (this.editorHistory.isUndoing) {
            this.owner.editorModule.applyTextFormatInternal(formField, text);
            this.editorHistory.recordChanges(this);
        } else {
            text = HelperMethods.formatText((formField.formFieldData as TextFormField).format, text);
            this.owner.editorModule.applyTextFormatInternal(formField, text);
            this.editorHistory.undoStack.push(this);
        }
    }
    private revertFormField(): void {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const fieldInfo: any = this.removedNodes[0];
        /* eslint-enable @typescript-eslint/no-explicit-any */
        const field: FieldElementBox = fieldInfo.formField;
        if (field.formFieldData instanceof CheckBoxFormField) {
            this.owner.editorModule.toggleCheckBoxFormField(field, true, fieldInfo.value);
        } else {
            this.owner.editorModule.updateFormField(field, fieldInfo.value);
        }
    }
    private revertBookmark(): void {
        const bookmarkInfo: BookmarkInfo = this.removedNodes[0] as BookmarkInfo;
        const bookmark: BookmarkElementBox = bookmarkInfo.bookmark;
        if (this.editorHistory.isUndoing) {
            let markerData: MarkerInfo = this.owner.editorModule.getMarkerData(bookmark);
            this.documentHelper.bookmarks.add(bookmark.name, bookmark);
            this.markerData.push(markerData);
            bookmark.line.children.splice(bookmarkInfo.startIndex, 0, bookmark);
            const previousNode: ElementBox = bookmark.previousNode;
            if (previousNode instanceof FieldElementBox && !isNullOrUndefined(previousNode.formFieldData)) {
                previousNode.formFieldData.name = bookmark.name;
            }
            this.markerData.push(markerData);
            bookmark.reference.line.children.splice(bookmarkInfo.endIndex, 0, bookmark.reference);

            this.editorHistory.recordChanges(this);
            if (this.owner.documentEditorSettings.showBookmarks == true) {
                this.viewer.updateScrollBars();
            }
            this.owner.editorModule.fireContentChange();
        } else {
            this.owner.editorModule.deleteBookmarkInternal(bookmark);
            this.editorHistory.undoStack.push(this);
        }
    }
    private revertComment(): void {
        const editPosition: string = this.insertPosition;
        const comment: CommentElementBox = this.removedNodes[0] as CommentElementBox;
        let insert: boolean = false;
        if (this.action === 'ResolveComment') {
            this.editorHistory.currentBaseHistoryInfo = this;
            this.owner.editorModule.resolveOrReopenComment(comment, !comment.isResolved);
            return;
        }
        if (this.action === 'EditComment') {
            let modifiedCommentObject: CommentEditInfo = this.modifiedProperties[0] as CommentEditInfo;
            this.editorHistory.currentBaseHistoryInfo = this;
            let commentView: CommentView = this.owner.commentReviewPane.commentPane.comments.get(comment);
            commentView.commentText.innerText = modifiedCommentObject.text;
            modifiedCommentObject.text = comment.text;
            comment.text = commentView.commentText.innerText;
            this.owner.editorHistoryModule.updateHistory();
            this.owner.fireContentChange();
            return;
        }
        if (this.action === 'InsertCommentWidget') {
            insert = (this.editorHistory.isRedoing);
        } else if (this.action === 'DeleteCommentWidget') {
            insert = (this.editorHistory.isUndoing);
        }
        if (insert) {
            if (comment) {
                this.insertedElement = comment.clone();
                if (comment.isReply) {
                    this.owner.editorModule.addReplyComment(comment, this.insertPosition);
                } else {
                    this.owner.editorModule.addCommentWidget(comment, false, true, true);
                }
            }
        } else {
            const commentElement: CommentElementBox = this.owner.editorModule.getCommentElementBox(editPosition);
            this.owner.editorModule.deleteCommentWidget(commentElement);
        }
    }
    private revertEditRangeRegion(): void {
        const editRangeInfo: EditRangeInfo = this.removedNodes[0] as EditRangeInfo;
        const editStart: EditRangeStartElementBox = editRangeInfo.editStart;
        if (this.editorHistory.isUndoing) {
            const user: string = editStart.user === '' ? editStart.group : editStart.user;
            this.owner.editorModule.updateRangeCollection(editStart, user);
            this.markerData.push(this.owner.editorModule.getMarkerData(editStart));
            this.markerData.push(this.owner.editorModule.getMarkerData(editStart.editRangeEnd));
            editStart.line.children.splice(editRangeInfo.startIndex, 0, editStart);
            editStart.editRangeEnd.line.children.splice(editRangeInfo.endIndex, 0, editStart.editRangeEnd);
            this.editorHistory.recordChanges(this);
        } else {
            this.owner.editorModule.removeUserRestrictionsInternal(editStart);
            this.editorHistory.undoStack.push(this);
        }
        this.owner.editorModule.fireContentChange();
    }
    /* eslint-disable  */
    public revert(): void {
        if (this.action === 'FormTextFormat') {
            this.revertFormTextFormat();
            return;
        }
        if (this.action === 'UpdateFormField') {
            this.revertFormField();
            return;
        }
        if (this.action === 'DeleteBookmark') {
            this.revertBookmark();
            return;
        }
        if (this.action === 'RemoveEditRange') {
            this.revertEditRangeRegion();
            return;
        }
        if (this.action === 'InsertCommentWidget' || this.action === 'DeleteCommentWidget' || this.action === 'ResolveComment' || this.action === 'EditComment') {
            this.revertComment();
            return;
        }
        if (this.action === 'ListFormat' && this.owner.editorModule.listNumberFormat !== '') {
            let abstractList: WListLevel = this.documentHelper.lists[0].abstractList.levels[this.owner.editorModule.listLevelNumber];
            let currentListLevelPattern: ListLevelPattern = abstractList.listLevelPattern;
            let currentNUmberFormat: string = abstractList.numberFormat
            abstractList.listLevelPattern = this.owner.editorModule.listLevelPattern;
            abstractList.numberFormat = this.owner.editorModule.listNumberFormat;
            this.owner.editorModule.listLevelPattern = currentListLevelPattern;
            this.owner.editorModule.listNumberFormat = currentNUmberFormat;
        }
        this.owner.isShiftingEnabled = true;
        let selectionStartTextPosition: TextPosition = undefined;
        let selectionEndTextPosition: TextPosition = undefined;
        let start: string = this.selectionStart;
        let end: string = this.selectionEnd;
        this.collabStart = this.selectionStart;
        this.collabEnd = this.selectionEnd;
        if (this.owner.enableCollaborativeEditing) {
            if (!isNullOrUndefined(this.insertPosition)) {
                this.insertIndex = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(this.insertPosition);
            }
            this.startIndex = this.insertIndex;
            if (!isNullOrUndefined(this.endPosition)) {
                let startPosition: TextPosition = this.owner.selection.getTextPosBasedOnLogicalIndex(this.insertPosition);
                let endPosition: TextPosition = this.owner.selection.getTextPosBasedOnLogicalIndex(this.endPosition);
                this.updateCollaborativeSelection(startPosition, endPosition);
            }
            this.startIndex = this.insertIndex;
        }
        let isForwardSelection: boolean = TextPosition.isForwardSelection(start, end);
        if (this.modifiedProperties.length > 0 || this.action === 'Selection'
            || this.action === 'ClearCharacterFormat' || this.action === 'ClearParagraphFormat') {
                selectionStartTextPosition = !isNullOrUndefined(start) ? this.owner.selectionModule.getTextPosBasedOnLogicalIndex(start): undefined;
                selectionEndTextPosition = !isNullOrUndefined(end)? this.owner.selectionModule.getTextPosBasedOnLogicalIndex(end): undefined;
            this.revertModifiedProperties(selectionStartTextPosition, selectionEndTextPosition);
        } else {
            let sel: Selection = this.owner.selectionModule;
            let deletedNodes: IWidget[] = this.removedNodes;
            if (this.removedNodes.length > 0) {
                if (this.action === 'InsertTable' && this.editorHistory.isRedoing) {
                    for (let i: number = 0; i < this.removedNodes.length; i++) {
                        this.insertedNodes.push(this.removedNodes[parseInt(i.toString(), 10)]);
                    }
                }
                this.isRemovedNodes = true;
            } else {
                this.isRemovedNodes = false;
            }
            this.removedNodesIn = [];
            if (isNullOrUndefined(this.endPosition)) {
                this.endPosition = this.insertPosition;
            }
            let isForward: boolean = TextPosition.isForwardSelection(this.insertPosition, this.endPosition);
            let insertTextPosition: TextPosition = sel.getTextPosBasedOnLogicalIndex(isForward ? this.insertPosition : this.endPosition);
            let endTextPosition: TextPosition = sel.getTextPosBasedOnLogicalIndex(isForward ? this.endPosition : this.insertPosition);
            // Set the endRevisionLogicalIndex based on undo stack value when the selection contains a table with the above paragraph (undoing).
            if (this.action === 'RemoveRowTrack' && this.editorHistory.isUndoing) {
                this.owner.selectionModule.select(this.selectionEnd, this.selectionEnd);
                if (this.owner.selectionModule.start.paragraph.isInsideTable) {
                    this.endRevisionLogicalIndex = this.selectionEnd;
                }
            }
            if (this.editorHistory.isUndoing) {
                if (this.lastElementRevision && isNullOrUndefined(this.isAcceptOrReject) && deletedNodes.length > 0 && deletedNodes[0] instanceof ParagraphWidget && (deletedNodes[0] as ParagraphWidget).isEmpty()) {
                    this.endRevisionLogicalIndex = this.selectionEnd;
                } else if (this.action === 'Delete' && this.editorHistory.currentHistoryInfo
                    && this.editorHistory.currentHistoryInfo.action === 'RemoveHyperlink'
                    && this.lastElementRevision instanceof FieldElementBox) {
                    // Bug 873011: Updated the selection for delete operation on "RemoveHyperlink" undo case.
                    this.endRevisionLogicalIndex = this.selectionEnd;
                } else if (this.lastElementRevision && isNullOrUndefined(this.endRevisionLogicalIndex)) {
                    this.updateEndRevisionInfo();
                } else if (this.action === 'RemoveRowTrack') {
                    this.endRevisionLogicalIndex = this.selectionEnd;
                }
            }
            if (this.action === 'ClearRevisions') {
                // Bug 873011: Handled the separate undo revision for field begin and field end for "ClearRevisions" action on hyperlink undo.
                let fieldBegin: FieldElementBox = sel.getHyperlinkField();
                if (this.isHyperlinkField && !isNullOrUndefined(fieldBegin)) {
                    let offset: number = fieldBegin.fieldSeparator.line.getOffset(fieldBegin.fieldSeparator, 1);
                    endTextPosition.setPositionParagraph(fieldBegin.fieldSeparator.line, offset);
                    this.undoRevisionForElements(insertTextPosition, endTextPosition, deletedNodes[deletedNodes.length - 1] as string);

                    let fieldEnd: FieldElementBox = fieldBegin.fieldEnd;
                    insertTextPosition.setPositionParagraph(fieldEnd.line, fieldEnd.line.getOffset(fieldEnd, 0));
                    endTextPosition.setPositionParagraph(fieldEnd.line, fieldEnd.line.getOffset(fieldEnd, 1));
                    this.undoRevisionForElements(insertTextPosition, endTextPosition, deletedNodes[deletedNodes.length - 1] as string);
                } else {
                    this.undoRevisionForElements(insertTextPosition, endTextPosition, deletedNodes[deletedNodes.length - 1] as string);
                }
                this.removedNodes.push(deletedNodes[deletedNodes.length - 1] as string);
                deletedNodes = [];
            }
            if (this.action === 'Uppercase') {
                sel.selectPosition(insertTextPosition, endTextPosition);
                this.editorHistory.currentBaseHistoryInfo = this;
                let editModule: Editor = this.owner.editorModule;
                editModule.changeSelectedTextCase(sel, insertTextPosition, endTextPosition, this.action.toString(), deletedNodes);
                editModule.reLayout(sel);
                return;
            }
            if(this.action === 'Lowercase'){
                sel.selectPosition(insertTextPosition, endTextPosition);
                this.editorHistory.currentBaseHistoryInfo = this;
                let editModule: Editor = this.owner.editorModule;
                editModule.changeSelectedTextCase(sel, insertTextPosition, endTextPosition, this.action.toString(), deletedNodes);
                editModule.reLayout(sel);
                return;
            }
            if(this.action === 'CapitalizeEachWord'){
                sel.selectPosition(insertTextPosition, endTextPosition);
                this.editorHistory.currentBaseHistoryInfo = this;
                let editModule: Editor = this.owner.editorModule;
                editModule.changeSelectedTextCase(sel, insertTextPosition, endTextPosition, this.action.toString(), deletedNodes);
                editModule.reLayout(sel);
                return;
            }
            if(this.action === 'SentenceCase'){
                sel.selectPosition(insertTextPosition, endTextPosition);
                this.editorHistory.currentBaseHistoryInfo = this;
                let editModule: Editor = this.owner.editorModule;
                editModule.changeSelectedTextCase(sel, insertTextPosition, endTextPosition, this.action.toString(), deletedNodes);
                editModule.reLayout(sel);
                return;
            }
            if(this.action === 'ToggleCase'){
                sel.selectPosition(insertTextPosition, endTextPosition);
                this.editorHistory.currentBaseHistoryInfo = this;
                let editModule: Editor = this.owner.editorModule;
                editModule.changeSelectedTextCase(sel, insertTextPosition, endTextPosition, this.action.toString(), deletedNodes);
                editModule.reLayout(sel);
                return;
            }
            if (insertTextPosition.isAtSamePosition(endTextPosition)) {
                sel.selectContent(insertTextPosition, true);
            } else {
                sel.selectPosition(insertTextPosition, endTextPosition);
            }
            if (this.action === 'InsertHyperlink' && this.editorHistory.isRedoing) {
                let fieldBegin: FieldElementBox = this.owner.selectionModule.getHyperlinkField();
                if (!isNullOrUndefined(fieldBegin)) {
                    let offset: number = (fieldBegin.line).getOffset(fieldBegin, 0);
                    insertTextPosition.setPositionParagraph(fieldBegin.line, offset);
                    this.owner.selectionModule.start.setPositionInternal(insertTextPosition);
                    offset = fieldBegin.fieldEnd.line.getOffset(fieldBegin.fieldEnd, 1);
                    endTextPosition.setPositionParagraph(fieldBegin.fieldEnd.line, offset);
                }
            }
            this.editorHistory.currentBaseHistoryInfo = this;
            this.selectionStart = this.insertPosition; this.insertPosition = undefined; this.selectionEnd = this.endPosition;
            this.endPosition = undefined;
            // Use this property to skip deletion if already selected content deleted case.
            let isRemoveContent: boolean = false;
            // Use this property to delete table or cell based on history action.
            let isDeletecell: boolean = false;
            if (this.action === 'DeleteCells') {
                isDeletecell = true;
            }
            if (this.endRevisionLogicalIndex && deletedNodes.length > 0) {
                let currentPosition: TextPosition = sel.getTextPosBasedOnLogicalIndex(this.endRevisionLogicalIndex);
                if (this.editorHistory.isUndoing || (this.editorHistory.isRedoing && insertTextPosition.isAtSamePosition(endTextPosition))) {
                    sel.selectPosition(insertTextPosition, currentPosition);
                }
                this.collabEnd = this.endRevisionLogicalIndex;
                if (this.owner.enableCollaborativeEditing) {
                    this.endIndex = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(currentPosition);
                    this.endIndex += this.paraInclude(currentPosition);
                }
                if (this.editorHistory.isUndoing || (this.editorHistory.isRedoing && !this.owner.selectionModule.isEmpty && deletedNodes.length > 0)) {
                    this.owner.editorModule.deleteSelectedContents(sel, true, isDeletecell);
                    isRemoveContent = true;
                }
            }
            if (!insertTextPosition.isAtSamePosition(endTextPosition) && !isRemoveContent) {
                isRemoveContent = this.action === 'BackSpace' || this.action === 'Delete' || this.action === 'ClearCells'
                    || this.action === 'DeleteCells';
                let skipDelete: boolean = (deletedNodes.length > 0 && this.action === 'ParaMarkTrack') || this.action === 'ClearRevisions' || this.action === 'AcceptTOC';
                if (!(isRemoveContent) && this.action !== 'MergeCells' && this.action !== 'InsertRowAbove'
                    && this.action !== 'InsertRowBelow' && this.action !== 'InsertColumnLeft'
                    && this.action !== 'InsertColumnRight' && this.action !== 'Borders'
                    && this.action !== 'DeleteTable' && this.action !== 'DeleteColumn' && this.action !== 'DeleteRow') {
                    sel.end.setPositionInternal(endTextPosition);
                    if (!this.owner.selectionModule.isEmpty && !skipDelete) {
                        if (this.editorHistory.isRedoing && this.action !== 'Accept Change' && this.action !== 'ParaMarkTrack' &&
                            this.action !== 'ParaMarkReject' && this.action !== 'RemoveRowTrack') {
                            this.owner.editorModule.removeSelectedContents(sel);
                        } else {
                            // Bug 873011: Handled the separate deletion for field begin and field end for "Accept Change" action on hyperlink redo.
                            let fieldBegin: FieldElementBox = sel.getHyperlinkField();
                            if (this.isHyperlinkField && !isNullOrUndefined(fieldBegin)
                                && this.editorHistory.isRedoing && this.action === 'Accept Change') {
                                let fieldEnd: FieldElementBox = fieldBegin.fieldEnd;
                                sel.start.setPositionParagraph(fieldBegin.line, (fieldBegin.line).getOffset(fieldBegin, 0));
                                sel.end.setPositionParagraph(fieldBegin.fieldSeparator.line, (fieldBegin.fieldSeparator.line).getOffset(fieldBegin.fieldSeparator, 1));
                                this.owner.editorModule.deleteSelectedContents(sel, true);
                                if (this.editorHistory && this.editorHistory.currentBaseHistoryInfo) {
                                    this.editorHistory.currentBaseHistoryInfo.removedNodes.reverse();
                                }

                                sel.start.setPositionParagraph(fieldEnd.line, (fieldEnd.line).getOffset(fieldEnd, 0));
                                sel.end.setPositionParagraph(fieldEnd.line, (fieldEnd.line).getOffset(fieldEnd, 1));
                                this.owner.editorModule.deleteSelectedContents(sel, true);
                                if (this.editorHistory && this.editorHistory.currentBaseHistoryInfo) {
                                    this.editorHistory.currentBaseHistoryInfo.removedNodes.reverse();
                                }
                            } else {
                                this.owner.editorModule.deleteSelectedContents(sel, true);
                            }
                        }
                        if (!isNullOrUndefined(this.editorHistory.currentHistoryInfo) &&
                            this.editorHistory.currentHistoryInfo.action === 'PageBreak' && this.documentHelper.blockToShift) {
                            this.documentHelper.layout.shiftLayoutedItems(false);
                        }
                    }
                }
            } else if(this.action === 'SectionBreakContinuous' && insertTextPosition && this.editorHistory.isUndoing) {
                if (insertTextPosition.offset === 0 && !isNullOrUndefined(insertTextPosition.paragraph.previousRenderedWidget) && insertTextPosition.paragraph.previousRenderedWidget instanceof ParagraphWidget && insertTextPosition.paragraph.previousRenderedWidget.isEndsWithPageBreak && insertTextPosition.paragraph.containerWidget instanceof BodyWidget && insertTextPosition.currentWidget === insertTextPosition.currentWidget.paragraph.firstChild && insertTextPosition.paragraph.containerWidget.sectionFormat.breakCode === 'NoBreak') {
                    let section: BodyWidget = (insertTextPosition.paragraph.previousRenderedWidget as ParagraphWidget).containerWidget as BodyWidget;
                    this.owner.editorModule.combineSectionInternal(this.owner.selectionModule, section, insertTextPosition.paragraph.containerWidget);
                    this.owner.editorModule.layoutWholeDocument();
                }
            } else {
                isRemoveContent = false;
                if (!insertTextPosition.isAtSamePosition(endTextPosition) ) {
                    isRemoveContent = this.action === 'BackSpace' || this.action === 'Delete' || this.action === 'ClearCells'
                    || this.action === 'DeleteCells';
                }
            }
            let isRedoAction: boolean = (this.editorHistory.isRedoing && !isRemoveContent);
            isRemoveContent = this.lastElementRevision ? false : isRemoveContent;
            this.revertModifiedNodes(deletedNodes, isRedoAction, isForwardSelection ? start : end, start === end, isForwardSelection ? end : start);
            if (isRemoveContent) {
                this.removeContent(insertTextPosition, endTextPosition, isDeletecell);
            }
            //this.owner.editorModule.reLayout(this.documentHelper.selection);
        }
        let isSelectionChanged: boolean = false;
        let updateSelection: boolean = false;
        if (!isNullOrUndefined(this.editorHistory.currentHistoryInfo) && (this.editorHistory.currentHistoryInfo.action === 'Reject All' || this.editorHistory.currentHistoryInfo.action === 'Accept All' || this.editorHistory.currentHistoryInfo.action === 'Paste')) {
            updateSelection = true;
        }
        if (this.action !== 'TrackingPageBreak' && ((this.editorHistory.isUndoing || this.endRevisionLogicalIndex || this.action === 'RemoveRowTrack' || updateSelection) && isNullOrUndefined(this.editorHistory.currentHistoryInfo) || updateSelection) ||
            ((this.action === 'InsertRowAbove' || this.action === 'Borders' || this.action === 'InsertRowBelow' || this.action === 'InsertColumnLeft' || this.action === 'InsertColumnRight' || this.action === 'Accept Change' || this.action === 'PasteColumn' || this.action === 'PasteRow' || this.action === 'PasteOverwrite' || this.action === 'PasteNested') && (this.editorHistory.isRedoing
                || this.editorHistory.currentHistoryInfo.action === 'Paste'))) {
            if (this.action === 'RemoveRowTrack' && this.editorHistory.isRedoing) {
                selectionStartTextPosition = !isNullOrUndefined(this.selectionStart) ? this.owner.selectionModule.getTextPosBasedOnLogicalIndex(this.selectionStart) : undefined;
                selectionEndTextPosition = !isNullOrUndefined(this.selectionEnd) ? this.owner.selectionModule.getTextPosBasedOnLogicalIndex(this.selectionEnd) : undefined;
            } else {
                selectionStartTextPosition = !isNullOrUndefined(start) ? this.owner.selectionModule.getTextPosBasedOnLogicalIndex(start): undefined;
                selectionEndTextPosition = !isNullOrUndefined(end) ? this.owner.selectionModule.getTextPosBasedOnLogicalIndex(end): undefined;
            }
            if (this.action !== 'ModifyStyle') {
                this.owner.selectionModule.selectRange(selectionStartTextPosition, selectionEndTextPosition);
            }
            this.documentHelper.updateFocus();
            isSelectionChanged = true;
        }
        this.owner.trackChangesPane.isTrackingPageBreak = false;
        let index: number = this.insertIndex;
        // Updates insert position of history info instance.
        this.insertPosition = start;
        this.endPosition = end;
        if (this.action === 'InsertHyperlink') {
            this.insertIndex = index;
        }
        if (!isNullOrUndefined(this.editorHistory.currentHistoryInfo) &&
            (this.editorHistory.currentHistoryInfo.action === 'Accept All'
                || this.editorHistory.currentHistoryInfo.action === 'Reject All' || this.editorHistory.currentHistoryInfo.action === 'RemoveComment')) {
            if (this.owner.documentHelper.blockToShift) {
                this.owner.documentHelper.layout.shiftLayoutedItems(false);
            }
        }
        this.owner.editorModule.reLayout(this.owner.selectionModule, this.owner.selectionModule.isEmpty);
        if (this.editorHistory.isUndoing && this.action === 'SectionBreak') {
            this.owner.editorModule.isSkipOperationsBuild = this.owner.enableCollaborativeEditing;
            this.owner.editorModule.layoutWholeDocument();
            this.owner.editorModule.isSkipOperationsBuild = false;            
        }
        if (isSelectionChanged) {
            this.documentHelper.scrollToPosition(this.owner.selectionModule.start, this.owner.selectionModule.end);
        }
        this.highlightListText();
    }
    private highlightListText(): void {
        if (!isNullOrUndefined(this.editorHistory.currentHistoryInfo)) {
            if (this.action === 'ListCharacterFormat' || (this.editorHistory.currentHistoryInfo.action === 'ListSelect' && this.action === 'ListFormat')) {
                let selectionStartTextPosition: TextPosition = this.owner.selectionModule.getTextPosBasedOnLogicalIndex(this.selectionStart);
                let widget: LineWidget = selectionStartTextPosition.currentWidget as LineWidget;
                this.documentHelper.selection.highlightListText(widget);
            }
        }
    }
    private removeContent(insertTextPosition: TextPosition, endTextPosition: TextPosition, isDeletecell?: boolean): void {
        //If the base parent of the insert text position and end text position is null 
        //then the paragraphs already removed.
        //Example scenario: In table editing that is delete cells operation 
        // we will backed up the entire table ad it will be replaced on undo operation.
        //At that time if the positions are in table 
        //which is already replaced in undo (revert modified nodes method) then the base parent of the paragraph will be null.
        //So again, selecting the content and deleting is unnecessary
        // and it will cause improper position updates and null reference exceptions. 
        if ((!isNullOrUndefined(insertTextPosition.paragraph.containerWidget) &&
            insertTextPosition.paragraph.containerWidget instanceof BodyWidget &&
            (!isNullOrUndefined(endTextPosition.paragraph.containerWidget)
                && endTextPosition.paragraph.containerWidget instanceof BodyWidget))
            || (!isNullOrUndefined(insertTextPosition.paragraph.containerWidget)
                && !isNullOrUndefined(endTextPosition.paragraph.containerWidget)
                && insertTextPosition.paragraph.containerWidget instanceof TableCellWidget
                && endTextPosition.paragraph.containerWidget instanceof TableCellWidget
                && !isNullOrUndefined(insertTextPosition.paragraph.bodyWidget)) ||
            (!isNullOrUndefined(insertTextPosition.paragraph.containerWidget)
                && !isNullOrUndefined(endTextPosition.paragraph.containerWidget)
                && insertTextPosition.paragraph.containerWidget instanceof TextFrame
                && endTextPosition.paragraph.containerWidget instanceof TextFrame)) {
            //Removes if any empty paragraph is added while delete.
            this.owner.selectionModule.selectRange(insertTextPosition, endTextPosition);
            this.documentHelper.updateFocus();
            let isDelete: boolean = false;
            if (this.action === 'BackSpace' || this.action === 'Uppercase' || this.action === 'RemoveRowTrack') {
                isDelete = true;
            }
            this.owner.editorModule.deleteSelectedContents(this.owner.selectionModule, isDelete, isDeletecell);
        }
    }
    public updateEndRevisionInfo(): void {
        this.lastElementRevision = this.checkAdjacentNodeForMarkedRevision(this.lastElementRevision);
        let currentRevision: TextPosition = this.retrieveEndPosition(this.lastElementRevision);
        let blockInfo: ParagraphInfo = this.owner.selectionModule.getParagraphInfo(currentRevision);
        let isLastChild = (blockInfo.paragraph == this.owner.editor.getLastParaForBodywidgetCollection(blockInfo.paragraph));
        if (blockInfo.paragraph.isInsideTable && blockInfo.paragraph == this.owner.selection.getLastParagraph(blockInfo.paragraph.associatedCell)) {
            isLastChild = true;
        }
        if (blockInfo.paragraph.getLength() == blockInfo.offset && !isLastChild) {
            blockInfo.offset++;
        }
        this.endRevisionLogicalIndex = this.owner.selectionModule.getHierarchicalIndex(blockInfo.paragraph, blockInfo.offset.toString());
        this.lastElementRevision.isMarkedForRevision = false;
    }
    private retrieveEndPosition(elementBox: ElementBox): TextPosition {
        let endPosition: TextPosition = new TextPosition(this.owner);
        let offset: number = elementBox.line.getOffset(elementBox, 0) + elementBox.length;
        endPosition.setPositionFromLine(elementBox.line, offset);
        return endPosition;
    }
    /**
     * Method to retrieve exact spitted node which is marked as last available element.
     *
     * @param {ElementBox} elementBox - Specifies the element box
     * @returns {ElementBox} - Returns element box 
     */
    private checkAdjacentNodeForMarkedRevision(elementBox: ElementBox): ElementBox {
        let nextItem: ElementBox = elementBox.nextNode;
        let markedNode: ElementBox;
        while (!isNullOrUndefined(nextItem) && nextItem.isMarkedForRevision) {
            markedNode = nextItem;
            nextItem = nextItem.nextNode;
        }
        return !isNullOrUndefined(markedNode) ? markedNode : elementBox;
    }

    private revertModifiedProperties(start: TextPosition, end: TextPosition): void {
        if (this.action === 'CellFormat' || this.action === 'CellOptions' || this.action === 'TableOptions') {
            this.owner.isShiftingEnabled = false;
        }
        if (!isNullOrUndefined(start) && !isNullOrUndefined(end)) {
            this.owner.selectionModule.selectRange(start, end);
        }
        this.documentHelper.updateFocus();
        if (this.action === 'RowResizing' || this.action === 'CellResizing') {
            this.revertResizing();
        } else if (this.action === 'CellOptions' || this.action === 'TableOptions') {
            this.revertTableDialogProperties(this.action);
        } else if (this.action !== 'Selection') {
            this.revertProperties();
        }
    }
    // Redoes the Action
    private redoAction(): void {
        let editor: Editor = this.owner.editorModule;
        this.action = this.action;
        switch (this.action) {
            case 'BackSpace':
                editor.singleBackspace(this.owner.selectionModule, true);
                break;
            case 'Delete':
                editor.singleDelete(this.owner.selectionModule, true);
                break;
            case 'DeleteTable':
                editor.deleteTable();
                break;
            case 'DeleteColumn':
                editor.deleteColumn();
                break;
            case 'DeleteRow':
                editor.deleteRow();
                break;
            case 'MergeCells':
                editor.mergeSelectedCellsInTable();
                break;
            case 'InsertRowAbove':
                editor.insertRow(true);
                break;
            case 'InsertRowBelow':
                editor.insertRow(false);
                break;
            case 'InsertColumnLeft':
                editor.insertColumn(true);
                break;
            case 'InsertColumnRight':
                editor.insertColumn(true);
                break;
            case 'SectionBreak':
                editor.insertSection(this.owner.selectionModule, true);
                break;
            case 'SectionBreakContinuous':
                editor.insertSection(this.owner.selectionModule, true, undefined, true);
                break;
            case 'TableAutoFitToContents':
                editor.autoFitTable('FitToContents');
                break;
            case 'TableAutoFitToWindow':
                editor.autoFitTable('FitToWindow');
                break;
            case 'TableFixedColumnWidth':
                editor.autoFitTable('FixedColumnWidth');
                break;
            case 'RemoveRowTrack':
                this.owner.selectionModule.handleAcceptReject(true);
                break;
        }
    }
    private revertModifiedNodes(deletedNodes: IWidget[], isRedoAction: boolean, start: string, isEmptySelection: boolean, end: string): void {
        if (isRedoAction && (this.action === 'BackSpace' || this.action === 'Delete' || this.action === 'DeleteTable'
            || this.action === 'DeleteColumn' || this.action === 'DeleteRow' || this.action === 'InsertRowAbove' ||
            this.action === 'InsertRowBelow' || this.action === 'InsertColumnLeft' || this.action === 'InsertColumnRight'
            || this.action === 'MergeCells' || this.action === 'SectionBreak' || this.action === 'SectionBreakContinuous' || this.action === 'TableAutoFitToContents' ||
            this.action === 'TableAutoFitToWindow' || this.action === 'TableFixedColumnWidth' || this.action === 'PasteColumn' || this.action === 'PasteOverwrite' || this.action === 'PasteNested')) {
            this.redoAction();
            if (this.action === 'SectionBreak' || this.action === 'SectionBreakContinuous') {
                return;
            }
        }
        if (deletedNodes.length > 0) {
            //tslint:disable-next-line:max-line-length
            if ((this.editorHistory.isUndoing && (this.action === 'RemoveRowTrack' || this.action === 'DeleteCells' ||
                this.action === 'DeleteColumn' || this.action === 'DeleteRow' || this.action === 'MergeCells'))
                || (this.action === 'InsertRowAbove' || this.action === 'InsertRowBelow' || this.action === 'InsertColumnLeft'
                //tslint:disable-next-line:max-line-length
                    || this.action === 'ClearCells' || this.action === 'InsertColumnRight' || this.action === 'Borders' || this.action === 'TableAutoFitToContents' || this.action === 'TableAutoFitToWindow' ||
                    this.action === 'TableFixedColumnWidth' || this.action === 'RemoveRowTrack' || this.action === 'PasteColumn' || this.action === 'PasteRow' || this.action === 'PasteOverwrite' || this.action === 'PasteNested')) {
                let insertIndex: string = this.selectionStart;
                let block: BlockWidget = this.owner.editorModule.getBlock({ index: insertIndex }).node as BlockWidget;
                let lastNode: IWidget = deletedNodes[deletedNodes.length - 1];
                if ((block instanceof TableWidget || block.previousRenderedWidget instanceof TableWidget || block.isInsideTable)
                    && lastNode instanceof TableWidget) {
                    if (block instanceof ParagraphWidget && !block.isInsideTable) {
                        block = block.previousRenderedWidget as BlockWidget;
                    } else if (block instanceof ParagraphWidget && block.isInsideTable) {
                        block = block.associatedCell.ownerTable;
                    }
                    block = block.combineWidget(this.viewer) as BlockWidget;
                    if (this.owner.enableCollaborativeEditing) {
                        let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
                        this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, block).position;
                        this.endIndex = this.startIndex + this.owner.selectionModule.getBlockLength(undefined, block, 0, { done: false }, true, undefined, undefined);
                        let operation: Operation = this.getDeleteOperation('Delete')
                        if (this.owner.enableTrackChanges) {
                            if (isNullOrUndefined(operation.markerData)) {
                                operation.markerData = {};
                            }
                            operation.markerData.isSkipTracking = true;
                        }
                        this.cellOperation.push(operation);
                    }
                    this.owner.editorModule.insertTableInternal(block as TableWidget, lastNode as TableWidget, false);
                    if (this.action === 'PasteColumn' || this.action === 'PasteRow' || this.action === 'PasteOverwrite' || this.action === 'PasteNested') {
                        this.removedNodes.push(block);
                    } else {
                        deletedNodes.splice(deletedNodes.indexOf(lastNode), 1);
                    }
                } else if (lastNode instanceof TableWidget && !(this.action === 'RemoveRowTrack')) {
                    this.owner.editorModule.insertBlock(lastNode as TableWidget);
                } else {
                    this.insertRemovedNodes(deletedNodes, deletedNodes[deletedNodes.length - 1] as BlockWidget);
                }
            } else {
                let initialStart: string = start;
                let block: BlockWidget = this.owner.editorModule.getBlock({ index: initialStart }).node as BlockWidget;
                // initialStart = blockObj.position;
                if (deletedNodes.length > 0 && (this.action === 'BackSpace' && isEmptySelection
                    || (!(block instanceof TableWidget) && !(block instanceof HeaderFooterWidget)))) {
                    let lastNode: IWidget = deletedNodes[0];
                    if (lastNode instanceof BodyWidget && !isNullOrUndefined(deletedNodes[1])) {
                        lastNode = deletedNodes[1];
                    }
                    if (this.action === 'TrackingPageBreak' || ((this.action === 'SectionBreak' || this.action === 'SectionBreakContinuous') && lastNode instanceof BodyWidget ||
                        !isNullOrUndefined(this.editorHistory.currentHistoryInfo) &&
                        this.editorHistory.currentHistoryInfo.action === 'PageBreak')) {
                        lastNode = deletedNodes[1];
                    }
                    if(lastNode instanceof WCharacterFormat) {
                        const newParagraph = new ParagraphWidget();
                        newParagraph.characterFormat = lastNode;
                        this.owner.editorModule.insertNewParagraphWidget(newParagraph, true);
                        deletedNodes.splice(deletedNodes.indexOf(lastNode), 1);
                        block = newParagraph;
                    }
                    let skipinsert: boolean = false;
                    if (!isNullOrUndefined(this.isAcceptOrReject)) {
                        skipinsert = true;
                        if (!isNullOrUndefined(this.owner.selectionModule.start.paragraph.nextRenderedWidget) && this.owner.selectionModule.start.paragraph.nextRenderedWidget instanceof TableWidget) {
                            skipinsert = false;
                        }
                    }
                    if (lastNode instanceof ParagraphWidget && this.owner.selectionModule.start.offset > 0 && !skipinsert) {
                        this.owner.editorModule.insertNewParagraphWidget(lastNode, true);
                        if (lastNode.characterFormat.removedIds.length > 0) {
                            this.owner.editorModule.constructRevisionFromID(lastNode.characterFormat, undefined);
                        }
                        deletedNodes.splice(deletedNodes.indexOf(lastNode), 1);
                        if (isNullOrUndefined(block)) {
                            let nextBlock: BlockWidget = this.documentHelper.selection.getNextParagraphBlock(lastNode.getSplitWidgets().pop() as BlockWidget);
                            this.owner.selectionModule.getNextRenderedBlock((lastNode as ParagraphWidget));
                            let startParagraph: BlockWidget = this.owner.selectionModule.start.paragraph;
                            if (nextBlock && startParagraph && startParagraph.bodyWidget instanceof BodyWidget
                                && !startParagraph.isInsideTable && !this.owner.selectionModule.isinEndnote && !this.owner.selectionModule.isinFootnote
                                && !startParagraph.bodyWidget.equals(nextBlock.bodyWidget)) {
                                nextBlock = undefined;
                            }
                            if (isNullOrUndefined(nextBlock)) {
                                //Sets the selection as starting of last paragraph.
                                this.owner.selectionModule.selectParagraphInternal(lastNode as ParagraphWidget, true);
                            }
                        }
                    }
                    if (lastNode instanceof TableWidget && this.owner.selectionModule.start.offset > 0) {
                        let firstBlock: BlockWidget = deletedNodes[deletedNodes.length - 1] as BlockWidget;
                        if (firstBlock instanceof ParagraphWidget) {
                            this.owner.editorModule.insertNewParagraphWidget(firstBlock, true);
                            deletedNodes.splice(deletedNodes.indexOf(firstBlock), 1);
                            if (isNullOrUndefined(block)) {
                                let nextBlock: BlockWidget = this.documentHelper.selection.getNextParagraphBlock(firstBlock.getSplitWidgets().pop() as BlockWidget);
                                if (isNullOrUndefined(nextBlock)) {
                                    //Sets the selection as starting of last paragraph.
                                    this.owner.selectionModule.selectParagraphInternal(firstBlock as ParagraphWidget, true);
                                }
                            }
                        }
                    }
                }
                if (deletedNodes.length > 0) {
                    let firstNode: IWidget = deletedNodes[deletedNodes.length - 1];
                    if (block instanceof TableWidget) {
                        block = block.combineWidget(this.viewer) as TableWidget;
                        if (firstNode instanceof TableWidget) {
                            if (this.owner.enableCollaborativeEditing) {
                                let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
                                let startIndex: number = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, block).position;
                                let endIndex: number = startIndex + this.owner.selectionModule.getBlockLength(undefined, block, 0, { done: false }, true, undefined, undefined);
                                let operation: Operation = this.getDeleteOperation('Delete')
                                operation.offset = startIndex;
                                operation.length = endIndex - startIndex;
                                this.cellOperation.push(operation);
                            }
                            this.owner.editorModule.insertTableInternal((block as TableWidget), firstNode as TableWidget, true);
                            deletedNodes.splice(deletedNodes.indexOf(firstNode), 1);
                            this.insertPosition = start;
                            let nextWidget: BlockWidget = firstNode.getSplitWidgets().pop() as BlockWidget;
                            if (nextWidget.nextRenderedWidget instanceof TableWidget) {
                                block = nextWidget.nextRenderedWidget as TableWidget;
                            } else {
                                initialStart = start;
                                block = this.owner.editorModule.getBlock({ index: initialStart }).node as BlockWidget;
                            }
                        }
                    }
                    //Checks if first node is paragraph and current insert position is paragraph end.
                    if (firstNode instanceof ParagraphWidget && this.owner.selectionModule.start.offset > 0
                        && this.owner.selectionModule.start.offset === this.owner.selectionModule.getLineLength(this.owner.selectionModule.start.paragraph.lastChild as LineWidget)) {
                        let editor: Editor = this.owner.editorModule;
                        editor.insertNewParagraphWidget(firstNode as ParagraphWidget, false);
                        if (firstNode.characterFormat.removedIds.length > 0) {
                            this.owner.editorModule.constructRevisionFromID(firstNode.characterFormat, undefined);
                        }
                        deletedNodes.splice(deletedNodes.indexOf(firstNode), 1);
                        //Removes the intermediate empty paragraph instance.
                        if (this.action !== 'Paste') {
                            editor.removeBlock(this.owner.selectionModule.start.paragraph);
                        }
                        let paragraph: ParagraphWidget = this.documentHelper.selection.getNextParagraphBlock(firstNode.getSplitWidgets().pop() as BlockWidget);
                        if (!isNullOrUndefined(paragraph)) {
                            this.owner.selectionModule.selectParagraphInternal(paragraph, true);
                        } else if (!isNullOrUndefined(firstNode)) {
                            this.owner.selectionModule.selectParagraphInternal(firstNode, false);
                        }
                    } else if (deletedNodes[0] instanceof TableWidget && deletedNodes.length !== 1) {
                        let nextNode: BlockWidget = deletedNodes[1] as BlockWidget;
                        if (nextNode instanceof ParagraphWidget && nextNode.isEmpty()) {
                            deletedNodes.splice(deletedNodes.indexOf(nextNode), 1);
                        }
                    }
                }
                if (deletedNodes.length > 0) {
                    if (block instanceof TableWidget) {
                        block = block.combineWidget(this.viewer) as BlockWidget;
                    }
                    this.insertRemovedNodes(deletedNodes, block, end);
                }
            }
        }
    }
    private insertRemovedNodes(deletedNodes: IWidget[], block: BlockWidget, endIndex?: string): void {
        // Use this property to relayout whole document (after complete all insertion intead of each section insertion) when insert section (this functionality already added in insertSection API).
        let isRelayout: boolean = false;
        for (let i: number = deletedNodes.length - 1, index: number = 0; i > -1; i--) {
            let node: IWidget = deletedNodes[i];
            if (this.isHyperlinkField && !isNullOrUndefined(endIndex) && node instanceof FieldElementBox && node.fieldType === 1) {
                // Bug 873011: Updated the selection for field end element insertion on "Accept Change" undo case.
                this.owner.selectionModule.start.setPositionInternal(this.owner.selectionModule.getTextPosBasedOnLogicalIndex(endIndex));
                this.owner.selectionModule.end.setPositionInternal(this.owner.selectionModule.start);
            }
            if (node instanceof ElementBox) {
                this.owner.editorModule.insertInlineInSelection(this.owner.selectionModule, node as ElementBox);
            } else if (node instanceof ParagraphWidget && node.childWidgets === undefined) {
                this.owner.selection.moveToNextParagraph();
            } else if (node instanceof BlockWidget) {
                if (node instanceof TableRowWidget) {
                    if (block instanceof TableWidget) {
                        block.childWidgets.splice(index, 0, node);
                        this.owner.editorModule.updateNextBlocksIndex(node, true);
                        if (i === 0 || !(deletedNodes[i - 1] instanceof TableRowWidget)) {
                            this.documentHelper.layout.layoutBodyWidgetCollection(block.index, block.containerWidget, block, false);
                        }
                    }
                } else if (block instanceof TableWidget && this.action !== 'RemoveRowTrack') {
                    this.owner.editorModule.insertBlockTable(this.owner.selectionModule, node as BlockWidget, block as TableWidget);
                } else {
                    if (node instanceof ParagraphWidget && !node.isInsideTable && this.action === 'RemoveRowTrack') {
                        this.owner.editorModule.insertNewParagraphWidget(node, false);
                    } else if (node instanceof TableWidget && this.action === 'RemoveRowTrack') {
                            this.owner.editorModule.insertTableInternal(node as TableWidget, node as TableWidget, false, true);
                        if (!isNullOrUndefined(deletedNodes[i - 1]) && !isNullOrUndefined(node.nextRenderedWidget) && node.nextRenderedWidget instanceof ParagraphWidget) {
                            this.owner.selectionModule.start.setPositionParagraph(node.nextRenderedWidget.firstChild as LineWidget, 0);
                            this.owner.selectionModule.end.setPositionParagraph(node.nextRenderedWidget.firstChild as LineWidget, 0);
                        }
                    } else {
                        this.owner.editorModule.insertBlock(node);
                    }
                }
            } else if (node instanceof WCharacterFormat) {
                let insertIndex: string = this.selectionStart;
                let wiget: BlockWidget = this.owner.editorModule.getBlock({ index: insertIndex }).node as BlockWidget;
                if (wiget instanceof ParagraphWidget) {
                    if (node.removedIds.length > 0) {
                        wiget.characterFormat.removedIds = node.removedIds.slice();
                        this.owner.editorModule.constructRevisionFromID(wiget.characterFormat, true);
                    } else if (wiget.characterFormat.revisions.length > 0) {
                        wiget.characterFormat = node.cloneFormat();
                    }
                }
            } else if (node instanceof BodyWidget) {
                if (!isNullOrUndefined(node.removedHeaderFooters) && node.removedHeaderFooters.length !== 0) {
                    this.owner.documentHelper.headersFooters.splice(node.sectionIndex, 0, node.removedHeaderFooters[0]);
                    node.removedHeaderFooters = undefined;
                }
                isRelayout = true;
                this.owner.editorModule.insertSection(this.owner.selectionModule, false, true, undefined, undefined, node.sectionFormat);
            } else if (typeof (node) === 'string' && this.action === 'AcceptTOC') {
                let insertIndex: string = this.selectionStart;
                let widget: BlockWidget = this.owner.editorModule.getBlock({ index: insertIndex }).node as BlockWidget;
                let endWidget: BlockWidget = this.owner.editorModule.getBlock({ index: this.selectionEnd }).node as BlockWidget;
                let currentRevision: Revision = this.owner.documentHelper.revisionsInternal.get(node);
                if (this.editorHistory.isUndoing) {
                    while (widget instanceof ParagraphWidget && widget !== endWidget) {
                        this.owner.editorModule.insertRevisionForBlock(widget, currentRevision.revisionType, true, currentRevision);
                        widget = this.documentHelper.selection.getNextParagraphBlock(widget.getSplitWidgets().pop() as BlockWidget);
                    }
                    this.owner.editorModule.insertRevisionForBlock(endWidget as ParagraphWidget, currentRevision.revisionType, true, currentRevision);
                } else {
                    while (currentRevision.range.length > 0) {
                        let item: ElementBox = currentRevision.range[0] as ElementBox;
                        let revisionIndex: number = item.revisions.indexOf(currentRevision);
                        if (revisionIndex >= 0) {
                            item.revisions.splice(revisionIndex, 1);
                            let rangeIndex: number = currentRevision.range.indexOf(item);
                            currentRevision.range.splice(rangeIndex, 1);
                            this.owner.trackChangesPane.updateCurrentTrackChanges(currentRevision);
                        }
                        if (currentRevision.range.length === 0) {
                            this.owner.revisions.remove(currentRevision);
                        }
                    }
                }
                this.owner.editorModule.addRemovedNodes(currentRevision.revisionID);
            }
        }
        if (isRelayout) {
            this.owner.editorModule.layoutWholeDocument(true);
        }
        deletedNodes = [];
    }

    public undoRevisionForElements(start: TextPosition, end: TextPosition, id: string): void {
        let currentPara: ParagraphWidget = start.paragraph;
        let endPara: ParagraphWidget = end.paragraph;
        let currentRevision: Revision = this.documentHelper.revisionsInternal.get(id);
        let startoffset: number = this.owner.selectionModule.getParagraphInfo(start).offset;
        let endoffset: number = this.owner.selectionModule.getParagraphInfo(end).offset;
        let isSamePara: boolean = start.paragraph === end.paragraph;
        let isSplittedWidget: boolean = false;
        if (this.editorHistory.isUndoing) {
            while (currentPara !== endPara) {
                isSplittedWidget = false;
                let endOffset = 0;
                if (!isNullOrUndefined(currentPara.previousSplitWidget)) {
                    startoffset = (currentPara.previousSplitWidget as ParagraphWidget).getLength() + 1;
                    endOffset = (currentPara.previousSplitWidget as ParagraphWidget).getLength() + currentPara.getLength();
                } else {
                    endOffset = currentPara.getLength();
                }
                this.owner.editorModule.applyRevisionForCurrentPara(currentPara, startoffset, endOffset, id, true);
                //Correct the condition to get next widget instead of next widget of next splitted widget
                currentPara = this.documentHelper.selection.getNextParagraphBlock(currentPara as BlockWidget);
                if (!isNullOrUndefined(currentPara) && !isNullOrUndefined(currentPara.previousRenderedWidget) && currentPara.previousRenderedWidget instanceof ParagraphWidget && currentPara.previousRenderedWidget.nextSplitWidget && currentPara === endPara) {
                    isSplittedWidget = true;
                }
                if (currentPara !== endPara) {
                    startoffset = 0;
                }
            }
            if (currentPara === endPara) {
                if (!isSamePara) {
                    startoffset = 0;
                }
                // Update the startoffset to the paragraph end if next paragraph is splitted widget
                if (isSplittedWidget) {
                    startoffset = (currentPara.previousRenderedWidget as ParagraphWidget).getLength();
                }
                this.owner.editorModule.applyRevisionForCurrentPara(currentPara, startoffset, endoffset, id, false);
            }
        } else {
            while (currentRevision.range.length > 0) {
                let item: ElementBox = currentRevision.range[0] as ElementBox;
                let revisionIndex: number = item.revisions.indexOf(currentRevision);
                if (revisionIndex >= 0) {
                    item.revisions.splice(revisionIndex, 1);
                    let rangeIndex: number = currentRevision.range.indexOf(item);
                    currentRevision.range.splice(rangeIndex, 1);
                    this.owner.trackChangesPane.updateCurrentTrackChanges(currentRevision);
                }
                if (currentRevision.range.length === 0) {
                    this.owner.revisions.remove(currentRevision);
                }
                if (currentPara.characterFormat.revisions.length > 0 && this.editorHistory.isRedoing) {
                    for (let i: number = 0; i < currentPara.characterFormat.revisions.length; i++) {
                        let revision: Revision  = currentPara.characterFormat.revisions[i];
                        if (revision.range.length === 0) {
                            currentPara.characterFormat.revisions.splice(i, 1);
                            i--;
                        }
                    }
                }
            }
        }
        this.removedNodes.push(id);
    }

    private revertResizing(): void {
        this.editorHistory.currentBaseHistoryInfo = this;
        if (this.action === 'RowResizing') {
            if (this.modifiedProperties[0] instanceof RowHistoryFormat) {
                let prevRowHistoryFormat: RowHistoryFormat = this.modifiedProperties[0] as RowHistoryFormat;
                let position: string = prevRowHistoryFormat.tableHierarchicalIndex;
                let block: TableWidget = this.owner.editorModule.getBlock({ index: position }).node as TableWidget;
                if (block instanceof TableWidget) {
                    (this.modifiedProperties[0] as RowHistoryFormat).revertChanges(this.editorHistory.isRedoing, this.owner, block);
                }
            }
        } else {
            if (this.modifiedProperties[0] instanceof TableHistoryInfo) {
                //selected cell resizing the condition checks done based on the selected widgets only. so need to highlight the selection.
                if (this.owner.selectionModule.selectedWidgets.length === 0) {
                    this.owner.selectionModule.highlightSelection(true);
                }
                let prevTableHistoryInfo: TableHistoryInfo = this.modifiedProperties[0] as TableHistoryInfo;
                let position: string = prevTableHistoryInfo.tableHierarchicalIndex;
                let block: TableWidget = this.owner.editorModule.getBlock({ index: position }).node as TableWidget;
                if (block instanceof TableWidget) {
                    let tableResize: TableResizer = this.owner.editorModule.tableResize;
                    this.owner.editorModule.setOffsetValue(this.owner.selectionModule);
                    block = block.combineWidget(this.owner.viewer) as TableWidget;
                    tableResize.currentResizingTable = block as TableWidget;
                    this.modifiedProperties.splice(0, 1);
                    if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
                        let tableHistoryInfoCurrent: TableHistoryInfo = new TableHistoryInfo(block, this.owner);
                        this.modifiedProperties.splice(0, 0, tableHistoryInfoCurrent);
                        this.owner.isLayoutEnabled = false;
                        tableResize.applyProperties(tableResize.currentResizingTable, prevTableHistoryInfo);
                        tableResize.currentResizingTable.isGridUpdated = true;
                        this.owner.isLayoutEnabled = true;
                        tableResize.updateGridValue(tableResize.currentResizingTable, false);
                        prevTableHistoryInfo.destroy();
                        prevTableHistoryInfo = undefined;
                    }
                }
            }
        }
    }
    private revertTableDialogProperties(action: Action): void {
        this.owner.isShiftingEnabled = false;
        this.editorHistory.currentBaseHistoryInfo = this;
        this.currentPropertyIndex = 0;
        if (action === 'CellOptions') {
            let selection: Selection = this.owner.selectionModule;
            let cellFormat: WCellFormat = <WCellFormat>this.modifiedProperties[0];
            this.owner.editorModule.updateCellMargins(selection, cellFormat);
        } else if (action === 'TableOptions') {
            this.owner.tableOptionsDialogModule.applyTableOptionsHelper(<WTableFormat>this.modifiedProperties[0]);
        }
        this.currentPropertyIndex = 0;
        this.owner.isShiftingEnabled = true;
    }
    public addModifiedPropertiesForSection(format: WSectionFormat, property: string, value: Object): Object {
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            let modifiedProperties: Object[] = this.modifiedProperties;
            let previousFormat: WSectionFormat = (this.currentPropertyIndex < modifiedProperties.length ?
                modifiedProperties[this.currentPropertyIndex] : modifiedProperties[modifiedProperties.length - 1]) as WSectionFormat;
            if (isNullOrUndefined(property)) {
                value = previousFormat;
                if (this.currentPropertyIndex < this.modifiedProperties.length) {
                    this.modifiedProperties[this.currentPropertyIndex] = format.cloneFormat();
                } else {
                    this.modifiedProperties[this.modifiedProperties.length - 1] = format.cloneFormat();
                }
            } else {
                value = previousFormat.getPropertyValue(property);
                previousFormat.copyFormat(format);
            }
            this.currentPropertyIndex++;
        } else {
            if (isNullOrUndefined(property)) {
                this.modifiedProperties.push(format.cloneFormat());
            } else {
                let currentFormat: WSectionFormat = new WSectionFormat();
                currentFormat.copyFormat(format);
                this.modifiedProperties.push(currentFormat);
            }
        }
        return value;
    }
    public addModifiedProperties(format: WCharacterFormat, property: string, value: Object): Object {
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            let previousFormat: WCharacterFormat = (this.currentPropertyIndex < this.modifiedProperties.length ? this.modifiedProperties[this.currentPropertyIndex] : this.modifiedProperties[this.modifiedProperties.length - 1]) as WCharacterFormat;
            let skipRemove: boolean = false;
            if (format.ownerBase instanceof ElementBox) {
                let prevLength: number = this.modifiedNodeLength[this.currentPropertyIndex];
                if ((format.ownerBase as ElementBox).length < prevLength) {
                    skipRemove = true;
                    this.modifiedNodeLength[this.currentPropertyIndex] = (format.ownerBase as ElementBox).length;
                    this.modifiedNodeLength.splice(this.currentPropertyIndex + 1, 0, prevLength - (format.ownerBase as ElementBox).length);
                    //Adds a copy of character format at next position for splitted inline.
                    let nextFormat: WCharacterFormat = new WCharacterFormat(undefined);
                    nextFormat.copyFormat(previousFormat);
                    this.modifiedProperties.splice(this.currentPropertyIndex + 1, 0, nextFormat);
                }
            }
            if (this.action === 'ClearCharacterFormat') {
                if (this.editorHistory.isUndoing) {
                    value = previousFormat;
                    if (!skipRemove) {
                        this.modifiedProperties.splice(this.currentPropertyIndex, 1);
                        this.currentPropertyIndex--;
                    }
                } else {
                    this.modifiedProperties.push(format.cloneFormat());
                }
            } else {
                value = previousFormat;
                if (this.currentPropertyIndex < this.modifiedProperties.length) {
                    this.modifiedProperties[this.currentPropertyIndex] = format.cloneFormat();
                } else {
                    this.modifiedProperties[this.modifiedProperties.length - 1] = format.cloneFormat();
                }
            }
            this.currentPropertyIndex++;
        } else {
            if (isNullOrUndefined(property)) {
                this.modifiedProperties.push(format.cloneFormat());
            } else {
                let currentFormat: WCharacterFormat = new WCharacterFormat(undefined);
                currentFormat.copyFormat(format);
                this.modifiedProperties.push(currentFormat);
            }
            if (format.ownerBase instanceof ElementBox) {
                this.modifiedNodeLength.push((format.ownerBase as ElementBox).length);
            } else {
                this.modifiedNodeLength.push(0);
            }
        }
        return value;
    }
    /**
     * build character Operation for undo/redo
     *
     * @private
     * @returns {void}
     */
    public buildCharacterFormatOperation(widget: ElementBox, format: WCharacterFormat): void {
        let position: TextPosition = this.owner.selectionModule.getElementPosition(widget, true).startPosition;
        let start: number = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(position);
        position.offset += widget.length;
        let end: number = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(position);
        let characterData: any = this.owner.sfdtExportModule.writeCharacterFormat(format, 0, true);
        let operation: Operation = {
            action: 'Format',
            offset: start,
            length: end - start,
            format: JSON.stringify(characterData),
            type: 'CharacterFormat',
        }
        this.modifiedFormatOperation.push(operation);
    }
     
    public addModifiedPropertiesForParagraphFormat(format: WParagraphFormat, property: string, value: Object): Object {
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            let previousFormat: WParagraphFormat = (this.currentPropertyIndex < this.modifiedProperties.length ? this.modifiedProperties[this.currentPropertyIndex] : this.modifiedProperties[this.modifiedProperties.length - 1]) as WParagraphFormat;
            if (this.action === 'ClearParagraphFormat') {
                if (this.editorHistory.isUndoing) {
                    value = previousFormat;
                    this.modifiedProperties.splice(this.currentPropertyIndex, 1);
                    this.currentPropertyIndex--;
                } else {
                    this.modifiedProperties.push(format.cloneFormat());
                }
                this.currentPropertyIndex++;
                return value;
            }
            if (isNullOrUndefined(property)) {
                value = previousFormat;
                if (this.currentPropertyIndex < this.modifiedProperties.length) {
                    this.modifiedProperties[this.currentPropertyIndex] = format.cloneFormat();
                } else {
                    this.modifiedProperties[this.modifiedProperties.length - 1] = format.cloneFormat();
                }
                this.currentPropertyIndex++;
                return value;
            }
            if (property === 'listFormat') {
                value = new WParagraphFormat(undefined);
                (value as WParagraphFormat).copyFormat(previousFormat);
                previousFormat.listFormat = new WListFormat(previousFormat);
                previousFormat.listFormat.copyFormat(format.listFormat);
                this.currentPropertyIndex++;
                return value;
            }
            if (property === 'tabStop') {
                value = [];
                for (let i = 0; i < previousFormat.tabs.length; i++) {
                    (value as WTabStop[]).push(previousFormat.tabs[i]);
                }
                let currentFormat: WParagraphFormat = new WParagraphFormat(undefined);
                currentFormat.copyFormat(format);
                this.modifiedProperties[this.currentPropertyIndex] = currentFormat;
                this.currentPropertyIndex++;
                return value;
            }
            if (property === 'styleName') {
                if (!isNullOrUndefined(previousFormat.baseStyle)) {
                    value = new WParagraphStyle();
                    (value as WParagraphStyle).copyStyle(previousFormat.baseStyle as WParagraphStyle);
                    this.currentPropertyIndex++;
                    if (!isNullOrUndefined(format.baseStyle)) {
                        previousFormat.baseStyle = new WParagraphStyle();
                        (previousFormat.baseStyle as WParagraphStyle).copyStyle(format.baseStyle as WParagraphStyle);
                    }
                    return value;
                } else {
                    if (!isNullOrUndefined(format.baseStyle)) {
                        previousFormat.baseStyle = new WParagraphStyle();
                        (previousFormat.baseStyle as WParagraphStyle).copyStyle(format.baseStyle as WParagraphStyle);
                    }
                    return undefined;
                }
            }
            if (property === 'borders') {
                value = previousFormat.borders.cloneFormat();
            } else if (this.action.indexOf('Border') >= 0) {
                value = previousFormat.borders.getBorder(property.replace('Border', ''));
            } else {
                value = previousFormat.getPropertyValue(property);
            }
            previousFormat.copyFormat(format);
            this.currentPropertyIndex++;
        } else {
            if (isNullOrUndefined(property)) {
                this.modifiedProperties.push(format.cloneFormat());
            } else {
                let currentFormat: WParagraphFormat = new WParagraphFormat(undefined);
                currentFormat.copyFormat(format);
                this.modifiedProperties.push(currentFormat);
            }
        }
        return value;
    }
    /**
     * build paragraph Operation for undo/redo
     *
     * @private
     * @returns {void}
     */
    public getParagraohFormatOperation(paragarph: ParagraphWidget, format: any): void {
        if ((this.modifiedProperties.length > 1 || this.modifiedFormatOperation.length > 0) && !isNullOrUndefined(paragarph)) {
            let position: TextPosition = this.owner.selectionModule.setPositionForBlock(paragarph, true);
            this.startIndex = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(position);
            this.endIndex = this.startIndex + this.owner.selectionModule.getBlockLength(undefined, paragarph, 0, { done: false }, true, undefined, undefined) - 1;
            this.insertedFormat = format;
            this.modifiedFormatOperation.push(...this.getActionInfo(true));
        }
    }
    public addModifiedPropertiesForContinueNumbering(paragraphFormat: WParagraphFormat, value: Object): Object {
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            let previousFormat: WParagraphFormat = <WParagraphFormat>(this.currentPropertyIndex < this.modifiedProperties.length ? this.modifiedProperties[this.currentPropertyIndex] : this.modifiedProperties[this.modifiedProperties.length - 1]);
            value = previousFormat;
            if (this.currentPropertyIndex < this.modifiedProperties.length) {
                this.modifiedProperties[this.currentPropertyIndex] = paragraphFormat.cloneFormat();
            } else {
                this.modifiedProperties[this.modifiedProperties.length - 1] = paragraphFormat.cloneFormat();
            }
            this.currentPropertyIndex++;
            return value;
        } else {
            let currentFormat: WParagraphFormat = new WParagraphFormat();
            currentFormat.copyFormat(paragraphFormat);
            this.modifiedProperties.push(currentFormat);
        }
        return value;
    }
    public addModifiedPropertiesForRestartNumbering(listFormat: WListFormat, value: Object): Object {
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            let listId: number = <number>(this.currentPropertyIndex < this.modifiedProperties.length ? this.modifiedProperties[this.currentPropertyIndex] : this.modifiedProperties[this.modifiedProperties.length - 1]);
            value = listId;
            if (this.currentPropertyIndex < this.modifiedProperties.length) {
                this.modifiedProperties[this.currentPropertyIndex] = listFormat.listId;
            } else {
                this.modifiedProperties[this.modifiedProperties.length - 1] = listFormat.listId;
            }
            this.currentPropertyIndex++;
            return value;
        } else {
            this.modifiedProperties.push(listFormat.listId);
        }
        return value;
    }
    public addModifiedPropertiesForList(listLevel: WListLevel): Object {
        let value: Object;
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            let previousLevel: ModifiedLevel = (this.currentPropertyIndex < this.modifiedProperties.length ? this.modifiedProperties[this.currentPropertyIndex] : this.modifiedProperties[this.modifiedProperties.length - 1]) as ModifiedLevel;
            value = previousLevel;
            previousLevel = new ModifiedLevel(listLevel, this.owner.editorModule.cloneListLevel(listLevel));
            if (this.currentPropertyIndex < this.modifiedProperties.length) {
                this.modifiedProperties[this.currentPropertyIndex] = previousLevel;
            } else {
                this.modifiedProperties[this.modifiedProperties.length - 1] = previousLevel;
            }
            this.currentPropertyIndex++;

        } else {
            this.modifiedProperties.push(new ModifiedLevel(listLevel, this.owner.editorModule.cloneListLevel(listLevel)));
            value = listLevel;
        }
        return value;
    }
    private revertProperties(): void {
        this.editorHistory.currentBaseHistoryInfo = this;
        this.currentPropertyIndex = 0;
        let property: string = this.getProperty();
        this.viewer.owner.editorModule.setOffsetValue(this.documentHelper.selection);
        if (this.action === 'ClearCharacterFormat' || this.modifiedProperties[0] instanceof WCharacterFormat) {
            if (this.action === 'ListCharacterFormat') {
                this.owner.editorModule.updateListCharacterFormat(this.documentHelper.selection, property, undefined);
                return;
            }
            this.owner.editorModule.updateSelectionCharacterFormatting(property, undefined, false);
        } else if (this.action === 'ClearParagraphFormat' || this.modifiedProperties[0] instanceof WParagraphFormat) {
            if (this.action === 'ContinueNumbering') {
                this.owner.editorModule.revertContinueNumbering(this.owner.selectionModule, <WParagraphFormat>this.modifiedProperties[0]);
                return;
            }
            if (this.action === 'StyleName' && this.modifiedProperties[0] instanceof WParagraphFormat) {
                this.owner.editorModule.updateSelectionParagraphFormatting(property, (this.modifiedProperties[0] as WParagraphFormat).baseStyle, false);
                return;
            }
            this.owner.editorModule.setPreviousBlockToLayout();
            this.owner.editorModule.updateSelectionParagraphFormatting(property, undefined, false);
        } else if (this.action === 'LinkToPrevious' && this.modifiedProperties[0] instanceof WSectionFormat) {
            let sectionIndex: number = parseInt(this.selectionStart.split(';')[0]);
            this.owner.editorModule.updateHeaderFooters(property, undefined, sectionIndex, (this.modifiedProperties[0] as WSectionFormat).removedHeaderFooters[0]);
        } else if (this.modifiedProperties[0] instanceof WSectionFormat) {
            this.owner.editorModule.updateSectionFormat(property, undefined);
        } else if (this.action === 'RestartNumbering') {
            this.owner.editorModule.restartListAtInternal(this.owner.selectionModule, <number>this.modifiedProperties[0]);
            return;
        } else if (this.modifiedProperties[0] instanceof ImageSizeInfo) {
            this.owner.selectionModule.updateImageSize(this.modifiedProperties[0] as ImageSizeInfo);
        } else if (this.modifiedProperties[0] instanceof ModifiedLevel) {
            let modified: Dictionary<number, ModifiedLevel> = new Dictionary<number, ModifiedLevel>();
            for (let i: number = 0; i < this.modifiedProperties.length; i++) {
                let modifiedLevel: ModifiedLevel = this.modifiedProperties[i] as ModifiedLevel;
                // modified.modifiedLevels.add(modifiedLevel.ownerListLevel.levelNumber, modifiedLevel);
                modified.add(i, modifiedLevel);
            }
            this.editorHistory.updateListChanges(modified);
            modified.destroy();
            modified = undefined;
        } else if (this.modifiedProperties[0] instanceof WTableFormat) {
            this.owner.editorModule.updateTableFormat(this.owner.selectionModule, property, undefined);
        } else if (this.modifiedProperties[0] instanceof WCellFormat) {
            this.owner.isShiftingEnabled = true;
            this.owner.editorModule.updateCellFormat(this.owner.selectionModule, property, undefined);
        } else if (this.modifiedProperties[0] instanceof WRowFormat) {
            this.owner.editorModule.updateRowFormat(this.owner.selectionModule, property, undefined);
        } else if (this.action === 'ModifyStyle') {
            let styleObject: Object = this.modifiedProperties.pop();
            this.owner.editor.updateStyleObject(styleObject);
        }
        this.currentPropertyIndex = 0;
        if (this.action === 'ClearCharacterFormat' || this.action === 'ClearParagraphFormat') {
            this.owner.editorModule.getOffsetValue(this.documentHelper.selection);
        }
    }
     public addModifiedCellOptions(applyFormat: WCellFormat, format: WCellFormat, table: TableWidget): WCellFormat {
        let currentFormat: WCellFormat;
        if (isNullOrUndefined(applyFormat.bottomMargin) && isNullOrUndefined(applyFormat.topMargin)
            && isNullOrUndefined(applyFormat.rightMargin) && isNullOrUndefined(applyFormat.leftMargin)) {
            currentFormat = this.copyCellOptions(table.tableFormat);
        } else {
            currentFormat = this.copyCellOptions(applyFormat);
        }
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            let previousFormat: WCellFormat = (this.currentPropertyIndex < this.modifiedProperties.length ? this.modifiedProperties[this.currentPropertyIndex] : this.modifiedProperties[this.modifiedProperties.length - 1]) as WCellFormat;
            format = previousFormat;
            if (this.currentPropertyIndex < this.modifiedProperties.length) {
                this.modifiedProperties[this.currentPropertyIndex] = this.copyCellOptions(applyFormat);
            } else {
                this.modifiedProperties[this.modifiedProperties.length - 1] = this.copyCellOptions(applyFormat);
            }
            this.currentPropertyIndex++;
            return format;
        } else {
            this.modifiedProperties.push(currentFormat);
        }
        return format;
    }
    private copyCellOptions(format: WCellFormat | WTableFormat): WCellFormat {
        let cellFormat: WCellFormat = new WCellFormat();
        cellFormat.topMargin = format.topMargin;
        cellFormat.rightMargin = format.rightMargin;
        cellFormat.bottomMargin = format.bottomMargin;
        cellFormat.leftMargin = format.leftMargin;
        return cellFormat;
    }
    public addModifiedTableOptions(format: WTableFormat): void {
        let currentFormat: WTableFormat = this.copyTableOptions(format);
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            let previousFormat: WTableFormat = (this.currentPropertyIndex < this.modifiedProperties.length ? this.modifiedProperties[this.currentPropertyIndex] : this.modifiedProperties[this.modifiedProperties.length - 1]) as WTableFormat;
            if (this.currentPropertyIndex < this.modifiedProperties.length) {
                this.modifiedProperties.splice(this.currentPropertyIndex, 1, currentFormat);
            } else {
                this.modifiedProperties.splice(this.modifiedProperties.length - 1, 1, currentFormat);
            }
            this.currentPropertyIndex++;
        } else {
            this.modifiedProperties.push(currentFormat);
        }
    }
    private copyTableOptions(format: WTableFormat): WTableFormat {
        let tableFormat: WTableFormat = new WTableFormat();
        tableFormat.topMargin = format.topMargin;
        tableFormat.rightMargin = format.rightMargin;
        tableFormat.bottomMargin = format.bottomMargin;
        tableFormat.leftMargin = format.leftMargin;
        tableFormat.cellSpacing = format.cellSpacing;
        return tableFormat;
    }
    private getProperty(): string {
        switch (this.action) {
            case 'Bold':
                return 'bold';
            case 'Italic':
                return 'italic';
            case 'FontColor':
                return 'fontColor';
            case 'FontFamily':
                return 'fontFamily';
            case 'FontSize':
                return 'fontSize';
            case 'HighlightColor':
                return 'highlightColor';
            case 'BaselineAlignment':
                return 'baselineAlignment';
            case 'Strikethrough':
                return 'strikethrough';
            case 'Underline':
                return 'underline';
            case 'AfterSpacing':
                return 'afterSpacing';
            case 'BeforeSpacing':
                return 'beforeSpacing';
            case 'LeftIndent':
                return 'leftIndent';
            case 'RightIndent':
                return 'rightIndent';
            case 'FirstLineIndent':
                return 'firstLineIndent';
            case 'LineSpacingType':
                return 'lineSpacingType';
            case 'LineSpacing':
                return 'lineSpacing';
            case 'TextAlignment':
                return 'textAlignment';
            case 'ListFormat':
                return 'listFormat';
            case 'PageHeight':
                return 'pageHeight';
            case 'PageWidth':
                return 'pageWidth';
            case 'DifferentOddAndEvenPages':
                return 'differentOddAndEvenPages';
            case 'TableAlignment':
                return 'tableAlignment';
            case 'TableLeftIndent':
                return 'leftIndent';
            case 'DefaultCellSpacing':
                return 'cellSpacing';
            case 'LeftMargin':
            case 'CellLeftMargin':
            case 'DefaultCellLeftMargin':
                return 'leftMargin';
            case 'RightMargin':
            case 'CellRightMargin':
            case 'DefaultCellRightMargin':
                return 'rightMargin';
            case 'TopMargin':
            case 'CellTopMargin':
            case 'DefaultCellTopMargin':
                return 'topMargin';
            case 'BottomMargin':
            case 'CellBottomMargin':
            case 'DefaultCellBottomMargin':
                return 'bottomMargin';
            case 'CellContentVerticalAlignment':
                return 'verticalAlignment';
            case 'RowHeight':
                return 'height';
            case 'RowHeightType':
                return 'heightType';
            case 'RowHeader':
                return 'isHeader';
            case 'AllowBreakAcrossPages':
                return 'allowBreakAcrossPages';
            case 'TablePreferredWidth':
            case 'CellPreferredWidth':
                return 'preferredWidth';
            case 'TablePreferredWidthType':
            case 'CellPreferredWidthType':
                return 'preferredWidthType';
            case 'Shading':
                return 'shading';
            case 'StyleName':
                return 'styleName';
            case 'ParagraphBidi':
            case 'TableBidi':
                return 'bidi';
            case 'ContextualSpacing':
                return 'contextualSpacing';
            case 'LinkToPrevious':
                return 'linkToPrevious';
            case 'LeftBorder':
            case 'TopBorder':
            case 'RightBorder':
            case 'BottomBorder':
            case 'HorizontalBorder':
            case 'VerticalBorder':
            case 'Borders':
                return (this.action[0].toLowerCase() + this.action.slice(1));
            case 'TabStop':
                return 'tabStop';
        }
        return undefined;
    }
    private getCharacterPropertyValue(property: string, modifiedProperty: WCharacterFormat): Object {
        let value: Object;
        if (property === 'bold') {
            value = modifiedProperty.bold;
        } else if (property === 'italic') {
            value = modifiedProperty.italic;
        } else if (property === 'fontColor') {
            value = modifiedProperty.fontColor;
        } else if (property === 'fontFamily') {
            value = modifiedProperty.fontFamily;
        } else if (property === 'fontSize') {
            value = modifiedProperty.fontSize;
        } else if (property === 'highlightColor') {
            value = modifiedProperty.highlightColor;
        } else if (property === 'baselineAlignment') {
            value = modifiedProperty.baselineAlignment;
        } else if (property === 'strikethrough') {
            value = modifiedProperty.strikethrough;
        } else if (property === 'underline') {
            value = modifiedProperty.underline;
        }
        return value;
    }
    public addModifiedTableProperties(format: WTableFormat, property: string, value: Object): Object {
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            let previousTableFormat: WTableFormat = (this.currentPropertyIndex < this.modifiedProperties.length ? this.modifiedProperties[this.currentPropertyIndex] : this.modifiedProperties[this.modifiedProperties.length - 1]) as WTableFormat;
            if (isNullOrUndefined(property)) {
                value = previousTableFormat;
                if (this.currentPropertyIndex < this.modifiedProperties.length) {
                    this.modifiedProperties[this.currentPropertyIndex] = format.cloneFormat();
                } else {
                    this.modifiedProperties[this.modifiedProperties.length - 1] = format.cloneFormat();
                }
                this.currentPropertyIndex++;
                return value;
            }
            if (property === 'shading') {
                value = previousTableFormat.shading;
            } else {
                value = previousTableFormat.getPropertyValue(property);
            }
            previousTableFormat.copyFormat(format);
            this.currentPropertyIndex++;
        } else {
            let currentFormat: WTableFormat = new WTableFormat();
            currentFormat.copyFormat(format);
            this.modifiedProperties.push(currentFormat);
        }
        return value;
    }
    public addModifiedRowProperties(rowFormat: WRowFormat, property: string, value: Object): Object {
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            let previousFormat: WRowFormat = (this.currentPropertyIndex < this.modifiedProperties.length ? this.modifiedProperties[this.currentPropertyIndex] : this.modifiedProperties[this.modifiedProperties.length - 1]) as WRowFormat;
            if (this.owner.enableCollaborativeEditing && this.modifiedProperties.length > 1 && rowFormat.ownerBase) {
                let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
                let startIndex: number = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, rowFormat.ownerBase).position;
                let endIndex: number = startIndex + 1;
                let rowData: any = {};
                if (!isNullOrUndefined(this.owner.sfdtExportModule)) {
                    this.owner.sfdtExportModule.assignRowFormat(rowData, previousFormat, 0);
                }
                let operation: Operation = {
                    action: 'Format',
                    offset: startIndex,
                    length: endIndex - startIndex,
                    format: JSON.stringify(rowData),
                    type: 'RowFormat',
                }
                this.modifiedFormatOperation.push(operation);
            }
            if (isNullOrUndefined(property)) {
                value = previousFormat;
                if (this.currentPropertyIndex < this.modifiedProperties.length) {
                    this.modifiedProperties[this.currentPropertyIndex] = rowFormat.cloneFormat();
                } else {
                    this.modifiedProperties[this.modifiedProperties.length - 1] = rowFormat.cloneFormat();
                }
                this.currentPropertyIndex++;
                return value;
            }
            value = previousFormat.getPropertyValue(property);
            previousFormat.copyFormat(rowFormat);
            this.currentPropertyIndex++;
        } else {
            let currentFormat: WRowFormat = new WRowFormat();
            currentFormat.copyFormat(rowFormat);
            this.modifiedProperties.push(currentFormat);
        }
        return value;
    }
    public addModifiedCellProperties(cellFormat: WCellFormat, property: string, value: Object): Object {
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            let previousFormat: WCellFormat = (this.currentPropertyIndex < this.modifiedProperties.length ? this.modifiedProperties[this.currentPropertyIndex] : this.modifiedProperties[this.modifiedProperties.length - 1]) as WCellFormat;
            if (isNullOrUndefined(property)) {
                value = previousFormat;
                if (this.currentPropertyIndex < this.modifiedProperties.length) {
                    this.modifiedProperties[this.currentPropertyIndex] = cellFormat.cloneFormat();
                } else {
                    this.modifiedProperties[this.modifiedProperties.length - 1] = cellFormat.cloneFormat();
                }
                this.currentPropertyIndex++;
                return value;
            }
            if (property === 'shading') {
                value = previousFormat.shading;
            } else {
                value = previousFormat.getPropertyValue(property);
            }
            previousFormat.copyFormat(cellFormat);
            this.currentPropertyIndex++;
        } else {
            let currentFormat: WCellFormat = new WCellFormat();
            currentFormat.copyFormat(cellFormat);
            this.modifiedProperties.push(currentFormat);
        }
        return value;
    }
    /**
     * @private
     * @returns {void}
     */
    public destroy(): void {
        this.selectionStart = undefined;
        this.selectionEnd = undefined;
        this.insertPosition = undefined;
        this.endPosition = undefined;
        if (!isNullOrUndefined(this.modifiedNodeLength)) {
            this.modifiedNodeLength = [];
            this.modifiedNodeLength = undefined;
        }
        if (!isNullOrUndefined(this.modifiedProperties)) {
            for (let i: number = 0; i < this.modifiedProperties.length; i++) {
                let property: object = this.modifiedProperties[i];
                if (property instanceof WCharacterFormat) {
                    (property as WCharacterFormat).destroy();
                } else if (property instanceof WParagraphFormat) {
                    (property as WParagraphFormat).destroy();
                } else if (property instanceof WSectionFormat) {
                    (property as WSectionFormat).destroy();
                } else if (property instanceof ModifiedLevel) {
                    (property as ModifiedLevel).destroy();
                }
                this.modifiedProperties.splice(this.modifiedProperties.indexOf(property), 1);
                i--;
            }
            this.modifiedPropertiesIn = undefined;
        }
        if (!isNullOrUndefined(this.removedNodes)) {
            for (let i: number = 0; i < this.removedNodes.length; i++) {
                let node: IWidget = this.removedNodes[i];
                if (node instanceof ParagraphWidget) {
                    (node as ParagraphWidget).destroyInternal(this.viewer);
                } else if (node instanceof ElementBox && !(node instanceof CommentCharacterElementBox)) {
                    (node as ElementBox).destroy();
                }
                this.removedNodes.splice(this.removedNodes.indexOf(node), 1);
                i--;
            }
            this.removedNodesIn = undefined;
        }
        if (!isNullOrUndefined(this.insertedNodes)) {
            for (let i: number = 0; i < this.insertedNodes.length; i++) {
                let node: IWidget = this.insertedNodes[i];
                if (node instanceof ParagraphWidget) {
                    (node as ParagraphWidget).destroyInternal(this.viewer);
                } else if (node instanceof ElementBox && !(node instanceof CommentCharacterElementBox)) {
                    (node as ElementBox).destroy();
                }
                this.insertedNodes.splice(this.insertedNodes.indexOf(node), 1);
                i--;
            }
            this.insertedNodes = undefined;
        }
        this.ownerIn = undefined;
    }
    /**
     * @private
     */
    public recordInsertRevisionDeletetion(widget: IWidget, startOffset?: number, endOffset?: number): void {
        if (this.startIndex > this.endIndex) {
            let temp: number = this.startIndex;
            this.startIndex = this.endIndex;
            this.endIndex = temp;
        }
        let startIndex: number = this.startIndex;
        let endIndex: number = this.endIndex;
        if (widget instanceof TextElementBox || widget instanceof ImageElementBox || widget instanceof FieldElementBox || widget instanceof BookmarkElementBox) {
            if (widget.revisions.length > 0) {
                const currentStart = this.owner.selectionModule.getElementPosition(widget, true).startPosition;
                startOffset = isNullOrUndefined(startOffset) ? 0 : startOffset;
                endOffset = isNullOrUndefined(endOffset) ? widget.length : endOffset;
                currentStart.setPositionParagraph(widget.line, startOffset + currentStart.offset);
                this.startIndex = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(currentStart);
                this.endIndex = this.startIndex + endOffset;
                let revision: Revision = this.owner.editorModule.retrieveRevisionInOder(widget);
                let currentUser: string = this.owner.currentUser === '' ? 'Guest user' : this.owner.currentUser;
                if (revision.revisionType === 'Insertion' && revision.author !== currentUser) {
                    this.revisionOperation.push(this.getFormatOperation());
                } else if (revision.revisionType === 'Insertion') {
                    let operation: Operation = this.getDeleteOperation('Delete', undefined, undefined)
                    this.revisionOperation.push(operation);
                    endIndex -= operation.length;
                } else if (revision.revisionType === 'Deletion') {
                    if (revision.author !== currentUser) {
                        let operation: Operation = this.getFormatOperation(widget);
                        if (widget.removedIds.length > 0) {
                            for (let i = 0; i < widget.removedIds.length; i++) {
                                if (!isNullOrUndefined(operation.markerData.removedIds)) {
                                    operation.markerData.removedIds = [];
                                }
                                operation.markerData.removedIds.push(widget.removedIds[i]);
                            }
                        }
                        this.revisionOperation.push(operation);
                    }
                }
            }
        } else if (widget instanceof ParagraphWidget) {
            let isAllRevision: boolean = true;
            for (let i: number = 0; i < widget.childWidgets.length; i++) {
                let line: LineWidget = widget.childWidgets[i] as LineWidget;
                if (line.children.length === 0) {
                    isAllRevision = false;
                }
                for (let j: number = 0; j < line.children.length; j++) {
                    let element: ElementBox = line.children[j];
                    if (element.revisions.length <= 0) {
                        isAllRevision = false;
                    } else if (element.revisions[0].revisionType !== 'Insertion') {
                        isAllRevision = false;
                    }
                }
            }
            if (isAllRevision) {
                let position: TextPosition = new TextPosition(this.owner);
                position.setPositionParagraph(widget.childWidgets[0] as LineWidget, 0);
                this.startIndex = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(position);
                let length: number = this.owner.selectionModule.getBlockLength(undefined, widget, 0, { done: false }, true, undefined, undefined);
                let currentUser: string = this.owner.currentUser === '' ? 'Guest user' : this.owner.currentUser;
                let revision: Revision = this.owner.editorModule.retrieveRevisionInOder((widget.childWidgets[0] as LineWidget).children[0]);
                if (currentUser === revision.author) {
                    this.endIndex = this.startIndex + length;
                    this.revisionOperation.push(this.getDeleteOperation(this.action, undefined, this.getRemovedText(widget)));
                    endIndex -= length;
                }
            } else {
                for (let i: number = 0; i < widget.childWidgets.length; i++) {
                    for (let j: number = 0; j < (widget.childWidgets[i] as LineWidget).children.length; j++) {
                        this.recordInsertRevisionDeletetion((widget.childWidgets[i] as LineWidget).children[j]);
                        startIndex = this.startIndex;
                        endIndex = this.endIndex;
                    }
                }
            }
        }
        this.startIndex = startIndex;
        this.endIndex = endIndex;
    }



    /**
     * @private
     */
    public getDeleteOperationsForTrackChanges(): Operation[] {
        let operations: Operation[] = [];
        let startIndex: number = this.startIndex;
        let endIndex: number = this.endIndex;
        let insertIndex: number = this.insertIndex;
        let isInsertRevision: boolean = false;

        this.startIndex = startIndex;
        this.endIndex = endIndex;
        for(let i: number = 0; i < this.revisionOperation.length; i++) {
            if(this.revisionOperation[i].action == 'Format' && isNullOrUndefined(this.revisionOperation[i].markerData)) {
                this.revisionOperation[i].markerData = this.markerData.pop();
            }
            operations.push(this.revisionOperation[i]);
        }
        for (let i = this.removedNodes.length - 1; i >= 0; i--) {
            let element: ElementBox = this.removedNodes[i] as ElementBox;
            if (element instanceof TextElementBox || element instanceof ImageElementBox || element instanceof FieldElementBox || element instanceof BookmarkElementBox) {
                if (element.removedIds.length === 0) {
                    let operation = this.getFormatOperation();
                    if (!isNullOrUndefined(operation.markerData)) {
                        for (let j: number = 0; j < this.markerData.length; j++) {
                            if (this.markerData[j].revisionType === 'Deletion') {
                                if (isNullOrUndefined(operation.markerData.splittedRevisions)) {
                                    operation.markerData.splittedRevisions = [];
                                }
                                if (this.checkValidRevision(this.markerData[j].revisionId)) {
                                    operation.markerData.splittedRevisions.push(this.markerData[j]);
                                }
                                this.markerData.splice(j, 1);
                                j--;
                            }
                        }
                    }
                    operations.push(operation);
                    break;
                }
            } else if (element instanceof ParagraphWidget) {
                if ((element as ParagraphWidget).characterFormat.revisions.length > 0) {
                    operations.push(this.getDeleteOperation(this.action));
                } else if ((element as ParagraphWidget).characterFormat.removedIds.length > 0) {
                    let operation: Operation = this.getDeleteOperation(this.action);
                    operation.markerData.isAcceptOrReject = this.isAcceptOrReject;
                    operations.push(operation);
                    let position: TextPosition = this.owner.selectionModule.getTextPosBasedOnLogicalIndex(this.insertPosition);
                    if (!position.isAtParagraphStart) {
                        //When accept the delete revision if paragraph is not start then paragraph is combining.
                        let endIndex: number = this.endIndex;
                        this.endIndex = this.startIndex;
                        operations.push(this.getDeleteOperation('Delete'));
                        this.endIndex = endIndex;
                    }
                    break;
                } else if ((element as ParagraphWidget).characterFormat.revisions.length === 0) {
                    let operation: Operation = this.getFormatOperation();
                    for (let j: number = 0; j < this.markerData.length; j++) {
                        if (this.markerData[j].revisionType === 'Deletion') {
                            if (isNullOrUndefined(operation.markerData.splittedRevisions)) {
                                operation.markerData.splittedRevisions = [];
                            }
                            if (this.checkValidRevision(this.markerData[j].revisionId)) {
                                operation.markerData.splittedRevisions.push(this.markerData[j]);
                            }
                            this.markerData.splice(j, 1);
                            j--;
                        }
                    }
                    this.markerData = [];
                    operations.push(operation);
                    break;
                }
            }
        }
        return operations;
    }
    private checkValidRevision(revisionID: string): boolean {
        for (let i: number = 0; i < this.owner.revisions.changes.length; i++) {
            if (this.owner.revisions.changes[i].revisionID === revisionID) {
                return true;
            }
        }
        return false;
    }
    /**
     * @private
     */
    public getDeleteOperationForTrackChanges(element: ElementBox): Operation {
        let operation: Operation;
        if (element instanceof TextElementBox || element instanceof ImageElementBox || element instanceof FieldElementBox || element instanceof BookmarkElementBox) {
            if ((element as TextElementBox).removedIds.length === 0) {
                operation = this.getFormatOperation(element);
            } else if ((element as TextElementBox).removedIds.length > 0) {
                let revisionId = (element as TextElementBox).removedIds[0];
                let revision: Revision = this.owner.editorModule.getRevision(revisionId);
                let currentUser: string = this.owner.currentUser === ''? 'Guest user': this.owner.currentUser;
                if (revision.revisionType === 'Insertion' && revision.author !== currentUser) {
                    operation = this.getFormatOperation(element);
                } else if (revision.revisionType === 'Insertion') {
                    operation = this.getDeleteOperation(this.action, undefined, this.getRemovedText(element));
                } else if (revision.revisionType === 'Deletion') {
                    if (revision.author !== currentUser) {
                        operation = this.getFormatOperation(element);
                        if (element.removedIds.length > 0) {
                            for (let i = 0; i < element.removedIds.length; i++) {
                                if (!isNullOrUndefined(operation.markerData.removedIds)) {
                                    operation.markerData.removedIds = [];
                                }
                                operation.markerData.removedIds.push(element.removedIds[i]);
                            }
                        }
                    }
                }
            }
        }
        if (this.action !== 'Enter' && !(element instanceof ParagraphWidget) && (isNullOrUndefined(operation) || operation.action !== 'Delete')) {
            this.startIndex += element.length;
        }
        return operation;
    }
    /**
     * @private
     */
    public getActionInfo(isInvertOperation?: boolean): Operation[] {
        let action: Action = this.action;
        if (!isNullOrUndefined(this.isAcceptOrReject) && this.isAcceptOrReject === 'Reject') {
            action = 'Reject Change';
        }
        let operations: Operation[] = [];
        switch (action.toString()) {
            case 'Insert':
            case 'InsertTextParaReplace':
            case 'Enter':
            case 'InsertInline':
            case 'SectionBreak':
            case 'SectionBreakContinuous':
                if (this.removedNodes.length > 0 && isNullOrUndefined(this.dropDownIndex)) {
                    if (this.owner.enableTrackChanges && !this.editorHistory.isUndoing) {
                        operations = this.getDeleteOperationsForTrackChanges();
                        if (action !== 'InsertInline') {
                            this.insertIndex = this.endIndex;
                        }
                    } else {
                        let deleteOperation: Operation = this.getDeleteOperation(action);
                        if(action === 'Enter' && this.owner.enableTrackChanges && this.editorHistory.isUndoing) {
                            deleteOperation.markerData = { isSkipTracking: true };
                        }
                        operations.push(deleteOperation);
                    }
                }
                if ((action === 'Enter' || this.insertedText.length > 0)) {
                    if (!this.editorHistory.isUndoing && (!this.editorHistory.isRedoing || action === 'Enter' || action === 'SectionBreak' || action === 'SectionBreakContinuous')) {
                        let operation = this.getInsertOperation(action);
                        if (this.owner.enableTrackChanges && this.action !== 'Enter') {
                            if (this.insertedElement instanceof FootnoteElementBox) {
                                operation.markerData = this.markerData[0];
                                this.markerData.splice(0, 1);
                                operation.text = CONTROL_CHARACTERS.Marker_Start;
                                operation.markerData.type = (this.insertedElement as FootnoteElementBox).footnoteType;
                                operation.markerData.revisionForFootnoteEndnoteContent = this.markerData.pop();
                            }
                            operations.push(operation);
                            for (let i = 0; i < this.splittedRevisions.length; i++) {
                                if (isNullOrUndefined(operation.markerData)) {
                                    operation.markerData = {};
                                }
                                if (isNullOrUndefined(operation.markerData.splittedRevisions)) {
                                    operation.markerData.splittedRevisions = [];
                                }
                                operation.markerData.splittedRevisions.push(this.splittedRevisions[i]);
                            }
                        } else {
                            operations.push(operation);
                        }
                    } else if (this.isRemovedNodes) {
                        let operationCollection: Operation[] = this.getDeleteContent(action);
                        operations = [...operations, ...operationCollection];
                    }
                }
                let operation2 = operations[operations.length - 1];
                if (action === 'Insert' && !isNullOrUndefined(operation2.text)) {
                    operation2.length = operation2.text.length;
                }
                if (!isNullOrUndefined(this.dropDownIndex)) {
                    operation2.markerData = { 'type': 'Field', 'dropDownIndex': this.dropDownIndex };
                    operation2.offset = this.getElementAbsolutePosition(this.fieldBegin);
                    operation2.type = 'DropDown';
                }
                break;
            case 'InsertTable':
            case 'InsertTableBelow':
                if (this.removedNodes.length > 0) {
                    operations.push(this.getDeleteOperation(action));
                }
                if (this.editorHistory.isUndoing && this.isRemovedNodes) {
                    operations.push(this.getUndoRedoOperation(action));
                } else {
                    let tableRowOperation: Operation[] = this.buildTableRowCellOperation(action);
                    for (let i: number = 0; i < tableRowOperation.length; i++) {
                        operations.push(tableRowOperation[i]);
                    }
                }
                break;
            case 'InsertRowAbove':
            case 'InsertRowBelow':
            case 'InsertColumnLeft':
            case 'InsertColumnRight':
                if (this.editorHistory.isUndoing) {
                    for (let i: number = 0; i < this.cellOperation.length; i++) {
                        operations.push(this.cellOperation[i]);
                    }
                    let operation: Operation = this.getUndoRedoOperation(action, true);
                    if (this.owner.enableTrackChanges && isNullOrUndefined(operation.markerData)) {
                        operation.markerData = { isSkipTracking: true };
                    }
                    operations.push(operation);
                } else {
                    let tableCellOperation: Operation[] = this.buildTableRowCellOperation(action);
                    if (action === 'InsertRowAbove' || action === 'InsertRowBelow') {
                        operations = tableCellOperation.slice();
                    } else {
                        operations = tableCellOperation.reverse().slice();
                    }
                }
                break;
            case 'BackSpace':
            case 'Delete':
            case 'Cut':
            case 'DeleteBookmark':
            case 'RemoveEditRange':
                if (this.editorHistory.isUndoing) {
                    if (action == "DeleteBookmark" || action == "RemoveEditRange") {
                        this.startIndex -= 1;
                        this.insertIndex = this.startIndex;
                        this.insertedText = CONTROL_CHARACTERS.Marker_Start;
                        operations.push(this.getInsertOperation(action));
                        this.insertedText = CONTROL_CHARACTERS.Marker_End;
                        operations.push(this.getInsertOperation(action, true));
                        if (action === 'RemoveEditRange') {
                            let operation = operations[operations.length - 1];
                            operation.offset -= 1;
                        }
                        this.startIndex += 1;
                    } else {
                        if (this.endRevisionLogicalIndex && this.editorHistory.isUndoing) {
                            if (this.removedNodes.length > 0) {
                                let deleteOperation: Operation = this.getDeleteOperation(action);
                                deleteOperation.markerData = { isSkipTracking: true };
                                operations.push(deleteOperation);
                            }
                            if (this.isRemovedNodes) {
                                let operationCollection: Operation[] = this.getDeleteContent(action);
                                operations = [...operations, ...operationCollection];
                            }
                        } else {
                            let operationCollection: Operation[] = this.getDeleteContent(action);
                            operations = [...operations, ...operationCollection];
                        }
                    }
                } else {
                    if (this.cellOperation.length > 0) {
                        operations = this.cellOperation;
                        this.cellOperation = [];
                    } else {
                        if (this.removedNodes.length > 0) {
                            if (this.owner.enableTrackChanges) {
                                if (this.editorHistory.isRedoing) {
                                    if (this.removedNodes.length > 0) {
                                        let deleteOperation: Operation = this.getDeleteOperation(action);
                                        deleteOperation.markerData = { isSkipTracking: true };
                                        operations.push(deleteOperation);
                                    }
                                    if (this.isRemovedNodes) {
                                        let operationCollection: Operation[] = this.getDeleteContent(action);
                                        operations = [...operations, ...operationCollection];
                                    }
                                } else {
                                    operations = this.getDeleteOperationsForTrackChanges();
                                }
                            } else {
                                let deleteOperation: Operation = this.getDeleteOperation(action);
                                operations.push(deleteOperation);
                                for (let i = 0; i < this.removedNodes.length; i++) {
                                    let element: ElementBox = this.removedNodes[parseInt(i.toString(), 10)] as ElementBox;
                                    if (element instanceof BodyWidget) {
                                        let headersFooters: HeaderFooters[] = element.removedHeaderFooters;
                                        for (let j = 0; j < headersFooters.length; j++) {
                                            let headerFooter: HeaderFooters = headersFooters[parseInt(j.toString(), 10)];
                                            let keysLength: number = Object.keys(headerFooter).length;
                                            if (keysLength > 0) {
                                                operations.push(this.getDeleteOperation('DeleteHeaderFooter', undefined));
                                                break;
                                            }
                                        }
                                    }
                                }
                                if (action === 'DeleteBookmark' || action === 'RemoveEditRange') {
                                    operations.push(this.getDeleteOperation(action, true));
                                    if (action === 'RemoveEditRange') {
                                        let operation = operations[operations.length - 1];
                                        operation.offset -= 1;
                                    }
                                }
                            }
                        }
                    }
                }
                this.markerData = [];
                break;
            case 'ResolveComment':
            case 'EditComment':
                for (let i = 0; i < this.removedNodes.length; i++) {
                    let operation: Operation = this.getUpdateOperation();
                    operations.push(this.getCommentOperation(operation, action, this.removedNodes[i] as CommentElementBox));
                }
                break;
            case 'ClearRevisions':
            case 'TrackingPageBreak':
                if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
                    if (this.removedNodes.length > 0) {
                        let deleteOperation: Operation = this.getDeleteOperation(action);
                        deleteOperation.markerData = { isSkipTracking: true };
                        operations.push(deleteOperation);
                    }
                    if (this.isRemovedNodes) {
                        let revision: Revision;
                        if (typeof (this.removedNodes[0]) === 'string') {
                            revision = this.owner.editorModule.getRevision(this.removedNodes[0] as string);
                        }
                        if (revision && revision.range[0] instanceof WCharacterFormat) {
                            operations.push(this.getInsertOperation('Enter'));
                        } else {
                            let operationCollection: Operation[] = this.getDeleteContent(action);
                            operations = [...operations, ...operationCollection];
                        }
                    }
                } else {
                    if (this.removedNodes.length > 0) {
                        let revision: Revision = this.owner.editorModule.getRevision(this.removedNodes[0] as string);
                        if (action === 'TrackingPageBreak') {
                            if (!(typeof this.removedNodes[0] === 'string')) {
                                let operation: Operation = this.getDeleteOperation(action);
                                operation.markerData.isAcceptOrReject = 'Reject';
                                operations.push(operation);
                                break;
                            }
                        }
                        operations.push(this.getRevisionOperation(revision));
                    }
                }
                break;
            case 'Reject Change':
                if(this.isRemovedNodes) {
                    let operationCollection: Operation[] = this.getDeleteContent(action);
                    operations = [...operations, ...operationCollection];
                } else {
                    let operation: Operation = this.getDeleteOperation(action);
                    operation.markerData.isAcceptOrReject = 'Reject';
                    operations.push(operation);
                }
                break;
            case 'Accept Change':
                if(this.isRemovedNodes) {
                    let operationCollection: Operation[] = this.getDeleteContent(action);
                    operations = [...operations, ...operationCollection];
                } else {
                    let deleteOperation: Operation = this.getDeleteOperation(action);
                    deleteOperation.markerData.isAcceptOrReject = 'Accept';
                    operations.push(deleteOperation);
                }
                break;
            case 'Paste':
            case 'PasteColumn':
            case 'PasteOverwrite':
            case 'PasteRow':
                if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
                    let isTextRemoved: boolean = false;
                    if (this.removedNodes.length > 0) {
                        for (let i: number = this.removedNodes.length - 1; i >= 0; i--) {
                            if (this.removedNodes[i] instanceof ParagraphWidget) {
                                isTextRemoved = true;
                            } else {
                                isTextRemoved = false;
                            }
                        }
                        operations.push(this.getDeleteOperation(action));
                        if (isTextRemoved) {
                            this.endIndex = this.startIndex;
                            operations.push(this.getDeleteOperation('Delete'));
                        }
                    }
                    if (this.isRemovedNodes) {
                        if (this.action === 'Paste') {
                            let operationCollection: Operation[] = this.getDeleteContent(action);
                            operations = [...operations, ...operationCollection];
                        } else {
                            operations.push(this.getUndoRedoOperation(action, true));
                        }
                    }

                } else {
                    if (this.removedNodes.length > 0) {
                        operations.push(this.getDeleteOperation('Delete'));
                    }
                    let length: number = this.getPasteContentLength();
                    if (action !== 'Paste') {
                        if (this.owner.selectionModule.start.paragraph.isInsideTable) {
                            length = this.owner.selectionModule.getBlockLength(undefined, this.owner.selectionModule.start.paragraph.associatedCell.ownerTable, 0, { done: false }, true, undefined, undefined);
                        }
                    }
                    let pasteOperation: Operation = {
                        action: 'Insert',
                        offset: this.startIndex,
                        length: length,
                        pasteContent: JSON.stringify(this.pasteContent),
                        type: isNullOrUndefined(this.type) ? 'Paste' : this.type,
                        markerData: this.markerData.pop()
                    }
                    operations.push(pasteOperation);
                }
                break;
            case 'InsertHyperlink':
                if (isNullOrUndefined(this.fieldBegin)) {
                    operations.push(this.getDeleteOperation('BackSpace'));
                    if (this.isRemovedNodes) {
                        let operationCollection: Operation[] = this.getDeleteContent(action);
                        operations = [...operations, ...operationCollection];
                    }
                } else {
                    if (this.isEditHyperlink) {
                        operations = this.getEditHyperlinkOperation();
                    } else {
                        operations = this.getFieldOperation();
                    }
                }
                this.fieldBegin = undefined;
                break;
            case 'UpdateFormField':
                this.insertedText = '';
                let operation1: Operation = this.getInsertOperation('UpdateFormField');
                operation1.text = CONTROL_CHARACTERS.Marker_Start;
                operation1.markerData = { 'type': 'Field', 'checkBoxValue': (this.fieldBegin.formFieldData as CheckBoxFormField).checked };
                operation1.offset = this.getElementAbsolutePosition(this.fieldBegin);
                operations.push(operation1);
                break;
            case 'DeleteRow':
            case 'DeleteCells':
            case 'DeleteColumn':
            case 'DeleteTable':
            case 'ClearCells':
            case 'MergeCells':
                if (this.editorHistory.isUndoing) {
                    if (action == 'DeleteTable') {
                        operations.push(this.getUndoRedoOperation(action));
                    } else {
                        operations = this.cellOperation.slice();
                        this.insertIndex = this.startIndex;
                        operations.push(this.getUndoRedoOperation(action, true));
                        this.cellOperation = [];
                    }

                } else {
                    if (this.removedNodes.length > 0) {
                        if (this.cellOperation.length > 0) {
                            // For delete column and delete cell.
                            for (let i: number = 0; i < this.cellOperation.length; i++) {
                                operations.push(this.cellOperation[i]);
                            }
                            if (action === 'MergeCells') {
                                operations.push(this.getPasteMergeOperation());
                                operations.push(this.getFormatOperation());
                                this.type = undefined;
                            } else {
                                operations.reverse();
                            }
                        } else {
                            if (this.owner.enableTrackChanges) {
                                operations.push(this.getFormatOperation(undefined, action));
                            } else {
                                operations.push(this.getDeleteOperation(action));
                            }
                        }
                        this.cellOperation = [];
                    }
                }
                break;
            case 'RemoveRowTrack':
                if (this.editorHistory.isUndoing) {
                    if (this.isRemovedNodes && this.editorHistory.isUndoing) {
                        operations = this.cellOperation.slice();
                        let operationCollection: Operation[] = this.getDeleteContent(action);
                        if (isNullOrUndefined(operationCollection[0].markerData)) {
                            operationCollection[0].markerData = { isSkipTracking: true }
                        }
                        operations.push(...operationCollection);
                    }
                } else {
                    if (this.removedNodes.length > 0) {
                        if (this.cellOperation.length > 0) {
                            operations.push(...this.cellOperation);
                        } else {
                            operations = this.revisionOperation.slice();
                            this.getTrackchangesOperation(operations);
                        }
                    }
                }
                break;
            case 'RowResizing':
            case 'CellResizing':
                operations = this.getResizingOperation(action);
                break;
            case 'ImageResizing':
                operations.push(this.getFormatOperation());
                break;
            case 'Bold':
            case 'Italic':
            case 'Underline':
            case 'FontSize':
            case 'Strikethrough':
            case 'BaselineAlignment':
            case 'HighlightColor':
            case 'FontColor':
            case 'FontFamily':
            case 'Uppercase':
            case 'Lowercase':
            case 'CapitalizeEachWord':
            case 'SentenceCase':
            case 'ToggleCase':
            case 'CharacterFormat':
                if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
                    if (action === 'Uppercase') {
                        operations.push(this.getDeleteOperation(action));
                        if (this.removedNodes) {
                            let operationCollection: Operation[] = this.getDeleteContent(action);
                            operations = [...operations, ...operationCollection];
                        }
                    } else {
                        operations = this.modifiedFormatOperation;
                        this.modifiedFormatOperation = [];
                    }
                } else {
                    let charFormatOperation: Operation[] = this.buildFormatOperation(action, true);
                    operations = charFormatOperation.slice();
                }
                break;
            case 'AfterSpacing':
            case 'BeforeSpacing':
            case 'RightIndent':
            case 'LeftIndent':
            case 'FirstLineIndent':
            case 'LineSpacing':
            case 'LineSpacingType':
            case 'TextAlignment':
            case 'Borders':
            case 'TopBorder':
            case 'BottomBorder':
            case 'LeftBorder':
            case 'RightBorder':
            case 'HorizontalBorder':
            case 'VerticalBorder':
            case 'ListFormat':
            case 'ParagraphFormat':
            case 'StyleName':
            case 'ClearParagraphFormat':
            case 'SpaceBeforeAuto':
            case 'SpaceAfterAuto':
            case 'ParagraphBidi':
            case 'ContextualSpacing':
            case 'ContinueNumbering':
            case 'List':
                if (this.modifiedFormatOperation.length > 0 && !isInvertOperation) {
                    operations = this.modifiedFormatOperation;
                    this.modifiedFormatOperation = [];
                } else {
                    if (isInvertOperation && this.editorHistory.isUndoing && (action === 'ListFormat' || action === 'ClearParagraphFormat')) {
                        action = 'ParagraphFormat';
                    }
                    if (action === 'ContinueNumbering') {
                        this.type = action.toString();
                    }
                    if (action === 'Borders' && this.removedNodes[this.removedNodes.length - 1] instanceof TableWidget) {
                        this.insertedText = CONTROL_CHARACTERS.Cell;
                        this.type = 'CellFormat';
                        this.createCellFormat(action);
                        operations = this.getSelectedCellOperation(action, undefined, true, false, true);
                        break;
                    }
                    let paraFormatOperation: Operation[] = this.buildFormatOperation(action, false);
                    operations = paraFormatOperation.slice();
                }
                break;
            case 'TableAlignment':
            case 'DefaultCellSpacing':
            case 'TableLeftIndent':
            case 'DefaultCellLeftMargin':
            case 'DefaultCellRightMargin':
            case 'DefaultCellTopMargin':
            case 'DefaultCellBottomMargin':
            case 'TablePreferredWidth':
            case 'TablePreferredWidthType':
            case 'TableBidi':
                this.createTableFormat(action);
                this.type = 'TableFormat';
                operations.push(this.getFormatOperation());
                this.format = undefined;
                break;
            case 'RestartNumbering':
                this.type = action.toString();
                let numberingOperation: Operation = this.getFormatOperation(undefined, action);
                this.createListFormat(action, numberingOperation);
                operations.push(numberingOperation);
                break;
            case 'Shading':
                this.createCellFormat(action);
                this.type = 'CellFormat';
                operations = this.getSelectedCellOperation(action, undefined, undefined, true, true);
                break;
            case 'TableAutoFitToContents':
            case 'TableAutoFitToWindow':
            case 'TableFixedColumnWidth':
                if (this.editorHistory.isUndoing) {
                    operations = this.getDeleteContent('Insert');
                } else {
                    this.createTableFormat(action);
                    this.type = 'TableFormat';
                    this.insertedText = action.toString();
                    operations.push(this.getFormatOperation());
                    this.format = undefined;
                }
                break;
            case 'SectionFormat':
            case 'HeaderDistance':
            case 'FooterDistance':
            case 'DifferentFirstPage':
            case 'DifferentOddAndEvenPages':
            case 'PageWidth':
            case 'PageHeight':
            case 'LeftMargin':
            case 'TopMargin':
            case 'RightMargin':
            case 'BottomMargin':
            case 'RestartPageNumbering':
            case 'PageStartingNumber':
            case 'EndnoteNumberFormat':
            case 'FootNoteNumberFormat':
            case 'RestartIndexForEndnotes':
            case 'RestartIndexForFootnotes':
            case 'InitialFootNoteNumber':
            case 'InitialEndNoteNumber':
            case 'LineBetweenColumns':
            case 'EqualWidth':
            case 'BreakCode':
            case 'LinkToPrevious':
                this.createSectionFormat(action);
                this.type = 'SectionFormat';
                operations.push(this.getFormatOperation(undefined));
                if (action === 'LinkToPrevious') {
                    let operation = operations[operations.length - 1];
                    operation.offset = this.insertIndex;
                }
                break;
            case 'RowHeight':
            case 'RowHeightType':
            case 'AllowBreakAcrossPages':
            case 'RowHeader':
                if (this.editorHistory.isUndoing || this.editorHistory.isRedoing && this.modifiedProperties.length > 1) {
                    operations = this.modifiedFormatOperation;
                    this.modifiedFormatOperation = [];
                } else {
                    this.createRowFormat(action);
                    this.type = 'RowFormat'
                    operations.push(this.getFormatOperation(undefined));
                    this.format = undefined;
                }
                break;
            case 'CellContentVerticalAlignment':
            case 'CellLeftMargin':
            case 'CellRightMargin':
            case 'CellBottomMargin':
            case 'CellTopMargin':
            case 'CellPreferredWidth':
            case 'CellPreferredWidthType':
                this.createCellFormat(action);
                this.type = 'CellFormat';
                operations = this.getSelectedCellOperation(action, false, false, false, true).slice();
                this.format = undefined;
                break;
        }
        this.cellOperation = [];
        this.revisionOperation = [];
        this.isRemovedNodes = false;
        return operations;
    }
    private getTrackchangesOperation(operations: Operation[]): void {
        let markerInfo: MarkerInfo[] = this.markerData;
        for (let i: number = markerInfo.length - 1; i >= 0; i--) {
            if (!isNullOrUndefined(markerInfo[i].revisionId)) {
                let revision: Revision = this.getRevision(markerInfo[i].revisionId);
                if (revision && revision.range.length > 0) {
                    if (revision.range[0] instanceof WRowFormat) {
                        operations.push(this.buildRowOperationForTrackChanges((revision.range[0] as WRowFormat).ownerBase, 'RemoveRowTrack'));
                    } else {
                        let startPosition: TextPosition = new TextPosition(this.owner);
                        let endPosition: TextPosition = new TextPosition(this.owner);
                        this.owner.selection.selectRevision(revision, startPosition, endPosition);
                        this.startIndex = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(startPosition);
                        this.endIndex = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(endPosition);
                        operations.push(this.getFormatOperation(undefined));
                    }
                } else {
                    this.owner.editorModule.removeMarkerInfoRevision(markerInfo[i].revisionId, markerInfo);
                }
            }
        }
    }
    private getRevision(revisionId: string): Revision {
        for (let i: number = 0; i < this.owner.revisions.changes.length; i++) {
            let revision: string = this.owner.revisions.changes[i].revisionID;
            if (revision === revisionId) {
                return this.owner.revisions.changes[i];
            }
        }
        return undefined;
    }
    /**
     * @private
     */
    private getElementAbsolutePosition(element: ElementBox): number {
        if (element) {
            let position: PositionInfo= this.owner.selectionModule.getElementPosition(element);
            let startIndex: number = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(position.startPosition);
            return startIndex;
        }
        return undefined;
    }
    /**
     * @private
     */
    public getFieldOperation(): Operation[] {
        let operations: Operation[] = [];
        let element: ElementBox = this.fieldBegin;
        let isFieldEnd: boolean = false;
        let elementOffset = this.insertIndex;
        if (!isNullOrUndefined(element)) {
            do {
                let insertedText;
                let Data: MarkerInfo;
                let elementLength;
                let characterFormat;
                let type;
                if (!element.skipformFieldLength) {
                    if (element instanceof FieldElementBox) {
                        if (element.fieldType === 0 && this.getRemovedText() !== '') {
                            operations.push(this.getDeleteOperation('Delete'));
                            let operation: Operation = operations[operations.length - 1];
                            operation.offset = elementOffset;
                            if (!isNullOrUndefined(operation.markerData) && this.owner.enableTrackChanges) {
                                operation.markerData.isSkipTracking = true;
                            }
                        }
                        insertedText = element.fieldType === 0 ? CONTROL_CHARACTERS.Marker_Start : element.fieldType === 1 ? CONTROL_CHARACTERS.Marker_End : element.fieldType === 2 ? CONTROL_CHARACTERS.Field_Separator : '';
                        if (element.fieldType === 0 && element.formFieldData) {
                            type = this.formFieldType;
                            if (element.revisions.length > 0) {
                                Data = this.owner.editorModule.getRevisionMarkerData(Data, element.revisions[0]);
                            }
                            if (isNullOrUndefined(Data)) {
                                Data = {};
                            }
                            Data.type = 'Field';
                            Data.formFieldData = JSON.stringify(element.formFieldData);
                        } else {
                            if(element.revisions.length > 0) {
                                Data = this.owner.editorModule.getRevisionMarkerData(Data, element.revisions[0]);
                            }
                            if (isNullOrUndefined(Data)) {
                                Data = {};
                            }
                            Data.type = 'Field';
                        }
                        elementLength = element.length;
                    } else if (this.fieldBegin.formFieldData && element instanceof BookmarkElementBox) {
                        insertedText = element.bookmarkType === 0 ? CONTROL_CHARACTERS.Marker_Start : CONTROL_CHARACTERS.Marker_End;
                        Data = { 'bookmarkName': element.name, 'type': 'Bookmark' };
                        elementLength = element.length;
                    } else if (element instanceof TextElementBox) {
                        insertedText = element.text;
                        elementLength = element.length;
                        if (element.revisions.length > 0) {
                            Data = this.owner.editorModule.getRevisionMarkerData(Data, element.revisions[0]);
                        }
                    }
                    if (!(element instanceof BookmarkElementBox)) {
                        let characterData: any = this.owner.sfdtExportModule.writeCharacterFormat(element.characterFormat, 0);
                        characterFormat = JSON.stringify(characterData);
                    }
                    let operation: Operation = {
                        action: 'Insert',
                        offset: elementOffset,
                        type: type,
                        text: insertedText,
                        length: elementLength,
                        markerData: Data,
                        format: characterFormat
                    }
                    operations.push(operation);
                    elementOffset += element.length;
                    Data = undefined;
                    type = undefined;
                    characterFormat = undefined;
                    if (element instanceof FieldElementBox && element.fieldType === 1) {
                        isFieldEnd = true;
                        if (this.fieldBegin.formFieldData && element.nextNode instanceof BookmarkElementBox) {
                            let elementBox: BookmarkElementBox = element.nextNode;
                            insertedText = elementBox.bookmarkType === 0 ? CONTROL_CHARACTERS.Marker_Start : CONTROL_CHARACTERS.Marker_End;
                            if (element.revisions.length > 0) {
                                Data = this.owner.editorModule.getRevisionMarkerData(Data, elementBox.revisions[0]);
                            }
                            if (isNullOrUndefined(Data)) {
                                Data = {};
                            }
                            Data.bookmarkName = elementBox.name;
                            Data.type = 'Bookmark';
                            elementLength = elementBox.length;
                            let operation: Operation = {
                                action: 'Insert',
                                offset: elementOffset,
                                text: insertedText,
                                length: elementLength,
                                markerData: Data
                            };
                            operations.push(operation);
                        }
                    }
                }
                element = element.nextNode;
            } while (!isFieldEnd && !isNullOrUndefined(element));
        }
        return operations;
    }
    /**
     * @private
     * @returns {Operation}
     * This method will build the operation for undo/Redo deleted content as paste action.
     */
    public getDeleteContent(action: Action): Operation[] {
        let operations: Operation[] = [];
        let startPosition: TextPosition = this.owner.selectionModule.getTextPosBasedOnLogicalIndex(this.collabStart);
        let endPosition: TextPosition = this.owner.selectionModule.getTextPosBasedOnLogicalIndex(this.collabEnd);
        let paraEnd: TextPosition = endPosition.clone();
        paraEnd.offset = endPosition.offset - 1;
        let isParaSelected: boolean = startPosition.isAtParagraphStart && paraEnd.isAtParagraphEnd;
        if (isParaSelected && (!startPosition.currentWidget.paragraph.isInsideTable)) {
            operations.push(this.getInsertOperation('Enter', false, true));
            operations.push(this.getUndoRedoOperation(action));
        } else if (startPosition.paragraph == endPosition.paragraph) {
            if (startPosition.isAtSamePosition(endPosition)) {
                if (this.owner.selectionModule.isEmpty && action === 'BackSpace') {
                    this.insertIndex -= 1;
                }
                operations.push(this.getUndoRedoOperation(action, false, true));
            } else {
                operations.push(this.getUndoRedoOperation(action));
            }
        } else {
            if (startPosition.currentWidget.paragraph.isInsideTable) {
                operations = this.cellOperation.slice();
                operations.push(this.getUndoRedoOperation(action, true));
            } else {
                operations.push(this.getUndoRedoOperation(action));
                this.startIndex = this.endIndex + 1;
                if (!(startPosition.isAtParagraphStart || paraEnd.isAtParagraphEnd)) {
                    let operation: Operation = this.getDeleteOperation('Delete');
                    if (this.owner.enableTrackChanges) {
                        operation.markerData = { isSkipTracking: true };
                    }
                    operations.push(operation);
                }
            }
        }
        return operations;
    }

    private getEditHyperlinkOperation(): Operation[] {
        let operations: Operation[] = [];
        let element = this.fieldBegin
        if (element) {
            let startIndex: number = this.getElementAbsolutePosition(element);
            operations.push(this.getDeleteOperation('Delete'));
            let operation = operations[operations.length - 1];
            operation.offset = startIndex;
            let fieldCode: string = this.getRemovedFieldCode();
            operation.length = fieldCode.length;
            operation.text = fieldCode;
            operations.push(this.getInsertOperation('InsertHyperlink'));
            operation = operations[operations.length - 1];
            operation.offset = startIndex;
            fieldCode = this.owner.selectionModule.getFieldCode(element, true);
            operation.text = fieldCode;
            operation.length = fieldCode.length;
        }
        return operations;
    }

    private getPasteContentLength(): number {
        let length: number = 0;
        for (let i: number = 0; i < this.insertedNodes.length; i++) {
            let block: BlockWidget = this.insertedNodes[i] as BlockWidget;
            if (block instanceof TextElementBox) {
                length += (block as TextElementBox).length;
            } else {
                length += this.owner.selectionModule.getBlockLength(undefined, block, 0, { done: false }, true, undefined, undefined);
            }
        }
        this.insertedNodes = [];
        return length;
    }
    /**
     * @private
     * @returns {Operation}
     */
    public getUpdateOperation(): Operation {
        let operation: Operation = {
            action: 'Update'
        }
        return operation;
    }
    private getResizingOperation(action: Action): Operation[] {
        let operations: Operation[] = [];
        let tableResize = this.owner.editorModule.tableResize;
        let table: TableWidget = tableResize.currentResizingTable;
        if (!isNullOrUndefined(table.childWidgets)) {
            table = table.combineWidget(this.owner.viewer) as TableWidget;
            let resizerPosition: number = tableResize.resizerPosition;
            let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
            if (action == 'RowResizing') {
                let row: TableRowWidget = table.childWidgets[resizerPosition] as TableRowWidget;
                if (isNullOrUndefined(row)) {
                    row = (this.modifiedProperties[0] as RowHistoryFormat).rowFormat.ownerBase;
                }
                this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, row).position;
                this.endIndex = this.startIndex + this.getRowLength(row);
                let rowFormat: any = {};
                if (!isNullOrUndefined(this.owner.sfdtExportModule)) {
                    this.owner.sfdtExportModule.assignRowFormat(rowFormat, row.rowFormat, 0);
                }
                this.format = JSON.stringify(rowFormat);
                this.insertedText = CONTROL_CHARACTERS.Row;
                operations.push(this.getFormatOperation());
            } else {
                let rightColumnIndex: number = resizerPosition;
                let leftColumnIndex: number = resizerPosition - 1;
                this.insertedText = CONTROL_CHARACTERS.Cell;
                let isResize: boolean = false;
                if (!this.owner.selectionModule.isEmpty) {
                    const cellwidget: Widget = tableResize.getTableCellWidget(tableResize.startingPoint) as Widget;
                    if (cellwidget && (this.owner.selectionModule.selectedWidgets.containsKey(cellwidget) || ((cellwidget as TableCellWidget).previousWidget
                        && this.owner.selectionModule.selectedWidgets.containsKey(((cellwidget as TableCellWidget).previousWidget))))) {
                        isResize = true;
                        const selectedCells: TableCellWidget[] = this.owner.selectionModule.getSelectedCells();
                        let startCell: TableCellWidget = selectedCells[0] as TableCellWidget;
                        let endCell: TableCellWidget = selectedCells[selectedCells.length - 1] as TableCellWidget;
                        let rowStartIndex: number = table.childWidgets.indexOf(startCell.ownerRow);
                        let count: number = table.childWidgets.indexOf(endCell.ownerRow);
                        let row: TableRowWidget = table.childWidgets[rowStartIndex] as TableRowWidget;
                        while (row && row.index <= count) {
                            let cell: TableCellWidget = row.firstChild as TableCellWidget;
                            while (cell) {
                                if (cell.index == rightColumnIndex || cell.index == leftColumnIndex) {
                                    let cellFormat: any = {};
                                    if (!isNullOrUndefined(this.owner.sfdtExportModule)) {
                                        cellFormat = this.owner.sfdtExportModule.writeCellFormat(cell.cellFormat, 0)
                                    }
                                    this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, cell).position;
                                    // Plus one for adding the cell index.
                                    this.endIndex = this.startIndex + this.owner.selectionModule.calculateCellLength(cell) + 1;
                                    this.type = "CellFormat";
                                    this.format = JSON.stringify(cellFormat);
                                    operations.push(this.getFormatOperation());
                                }
                                cell = cell.nextWidget as TableCellWidget;
                            }
                            let rowFormat: any = {};
                            if (!isNullOrUndefined(this.owner.sfdtExportModule)) {
                                this.owner.sfdtExportModule.assignRowFormat(rowFormat, row.rowFormat, 0);
                            }
                            this.format = JSON.stringify(rowFormat);
                            this.type = "RowFormat";
                            this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, row).position;
                            this.endIndex = this.startIndex + this.getRowLength(row);
                            operations.push(this.getFormatOperation());
                            row = row.getSplitWidgets().pop().nextRenderedWidget as TableRowWidget;
                        }
                    }
                } else {
                    isResize = true;
                    let row: TableRowWidget = table.firstChild as TableRowWidget;
                    while (row) {
                        let cell: TableCellWidget = row.firstChild as TableCellWidget;
                        while (cell) {
                            if (cell.index == rightColumnIndex || cell.index == leftColumnIndex) {
                                let cellFormat: any = {};
                                if (!isNullOrUndefined(this.owner.sfdtExportModule)) {
                                    cellFormat = this.owner.sfdtExportModule.writeCellFormat(cell.cellFormat, 0)
                                }
                                this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, cell).position;
                                // Plus one for adding the cell index.
                                this.endIndex = this.startIndex + this.owner.selectionModule.calculateCellLength(cell) + 1;
                                this.type = "CellFormat";
                                this.format = JSON.stringify(cellFormat);
                                operations.push(this.getFormatOperation());
                            }
                            cell = cell.nextWidget as TableCellWidget;
                        }
                        let rowFormat: any = {};
                        if (!isNullOrUndefined(this.owner.sfdtExportModule)) {
                            this.owner.sfdtExportModule.assignRowFormat(rowFormat, row.rowFormat, 0);
                        }
                        this.format = JSON.stringify(rowFormat);
                        this.type = "RowFormat";
                        this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, row).position;
                        this.endIndex = this.startIndex + this.getRowLength(row);
                        operations.push(this.getFormatOperation());
                        row = row.getSplitWidgets().pop().nextRenderedWidget as TableRowWidget;
                    }
                }
                if (isResize) {
                    let tableFormat: any = {};
                    tableFormat = this.owner.sfdtExportModule ? this.owner.sfdtExportModule.writeTableFormat(table.tableFormat, 0) : {};
                    this.format = JSON.stringify(tableFormat);
                    this.type = "TableFormat";
                    this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, table).position;
                    // this.startIndex will get the offset of table. So in get block length it will start from the table. So doing minus one.
                    this.endIndex = this.startIndex + this.owner.selectionModule.getBlockLength(undefined, table as TableWidget, 0, { done: false }, true, undefined, undefined) - 1;
                    operations.push(this.getFormatOperation());
                }
            }
            this.owner.documentHelper.layout.reLayoutTable(table);
        }
        this.format = undefined;
        return operations;
    }
    private getRowLength(row: TableRowWidget): number {
        let length: number = 0;
        for (let i: number = 0; i < row.childWidgets.length; i++) {
            // for collab editing for row amd cell we are adding plus one index to the offset. So it will calculate the widgets inside the cell one. So adding plus one offset.
            length += this.owner.selectionModule.calculateCellLength(row.childWidgets[i] as TableCellWidget) + 1;
        }
        return length;
    }
    /**
     * @private
     * @returns {Operation}
     */
    public getDeleteOperation(action: Action, setEndIndex?: boolean, text?: string): Operation {
        if (this.startIndex > this.endIndex) {
            let temp: number = this.startIndex;
            this.startIndex = this.endIndex;
            this.endIndex = temp;
        }
        // if (action === 'Delete' && this.endIndex === this.startIndex) {
        //     this.startIndex++;
        //     this.endIndex++;
        // }
        if (action === 'Delete' && this.endIndex < this.startIndex) {
            let start: number = this.startIndex;
            this.startIndex = this.endIndex;
            this.endIndex = start;
        }
        if (this.endIndex === this.startIndex && action !== 'DeleteBookmark' && action !== 'RemoveEditRange' && this.action !== 'InsertHyperlink') {
            if (action === 'BackSpace' || action === 'Insert' || action === 'Enter') {
                this.startIndex--;
            } else {
                this.endIndex++;
            }
        }
        if (action === 'DeleteHeaderFooter') {
            this.startIndex = this.headerFooterStart;
            this.endIndex = this.headerFooterEnd;
        }
        let selectionLength: number = !isNullOrUndefined(text) ? text.length : this.endIndex - this.startIndex;
        let removedText: string;
        if (action === 'DeleteBookmark' || action === 'RemoveEditRange') {
            removedText = this.insertedText;
            selectionLength = 1;
        } else if (action === 'DeleteHeaderFooter') {
            removedText === '';
        } else if (action === 'DeleteTable' || action === 'DeleteRow' || action === 'DeleteColumn' || action === 'MergeCells' || action === 'RemoveRowTrack') {
            removedText = this.insertedText;
            if (action !== 'DeleteTable' && action !== 'DeleteRow') {
                selectionLength = this.tableRelatedLength;
            }
        } else {
            removedText = !isNullOrUndefined(text) ? text : this.getRemovedText();
        }
        if (action === 'Cut' && removedText[removedText.length - 1] === ' ' && selectionLength < removedText.length) {
            selectionLength = removedText.length;
        }
        let operation: Operation = {
            action: 'Delete',
            offset: setEndIndex ? this.endIndex : this.startIndex,
            text: removedText,
            length: (action === 'Paste' || selectionLength === 0) ? removedText.length : selectionLength,
            skipOperation: action === 'DeleteHeaderFooter' ? true : undefined,
            markerData: this.markerData[0],
        }
        if (this.removedNodes[0] instanceof FootnoteElementBox) {
            if (this.editorHistory.isUndoing && operation.length >= 3) {
                operation.length += 1;
            } else {
                let element: ElementBox = this.removedNodes[0] as ElementBox;
                let lastPara: ParagraphWidget = (element as FootnoteElementBox).bodyWidget.lastChild as ParagraphWidget;
                let positionInfo: AbsolutePositionInfo = { position: 0, done: false };
                let paragraphInfo: ParagraphInfo = { paragraph: lastPara, offset: this.owner.selectionModule.getParagraphLength(lastPara) + 1 };
                this.owner.selectionModule.getPositionInfoForBodyContent(paragraphInfo, positionInfo, (element as FootnoteElementBox).bodyWidget.firstChild as ParagraphWidget);
                operation.length += positionInfo.position;
            }
        }
        return operation;
    }

    /**
     * @private
     * @returns {Operation}
     */
    public getInsertOperation(action: Action, setEndIndex?: boolean, skipMarkerData?: boolean): Operation {
        let insertedText: string = action === 'Enter' ? '\n' : this.insertedText;
        let length: number;
        if (action === 'InsertTable' || action === 'InsertTableBelow' || action === 'InsertRowAbove' || action === 'InsertRowBelow'
            || action === 'InsertColumnLeft' || action === 'InsertColumnRight' || action === 'MergeCells' || action === 'RemoveRowTrack') {
            length = this.tableRelatedLength;
            if (this.action === 'InsertTable' || this.action === 'InsertTableBelow') {
                this.insertIndex = this.startIndex;
            }
        } else {
            if (!isNullOrUndefined(insertedText)) {
                length = insertedText.length;
            }
        }
        let operation: Operation = {
            action: 'Insert',
            offset: setEndIndex ? this.endIndex : this.insertIndex,
            text: insertedText,
            type: this.type,
            length: length,
            skipOperation: false,
            imageData: this.insertedData,
            format: this.format,
        }
        if (!isNullOrUndefined(this.markerData) && !skipMarkerData) {
            operation.markerData = this.markerData.pop();
        }
        if (this.insertedElement instanceof FootnoteElementBox) {
            let lastPara: ParagraphWidget = (this.insertedElement as FootnoteElementBox).bodyWidget.lastChild as ParagraphWidget;
            let positionInfo: AbsolutePositionInfo = { position: 0, done: false };
            let paragraphInfo: ParagraphInfo = { paragraph: lastPara, offset: this.owner.selectionModule.getParagraphLength(lastPara) + 1 };
            this.owner.selectionModule.getPositionInfoForBodyContent(paragraphInfo, positionInfo, (this.insertedElement as FootnoteElementBox).bodyWidget.firstChild as ParagraphWidget);
            operation.length += positionInfo.position;
        }
        return operation;
    }

    private getUndoRedoOperation(action: Action,isTableInsert?: boolean, issamePosition?: boolean): Operation {
        let table: TableWidget;
        let lastPara: ParagraphWidget;
        let startLine: LineWidget;
        let lastLine: LineWidget;
        let endoffset: number;
        let startOffset: number;
        let startPosition: TextPosition = this.owner.selectionModule.getTextPosBasedOnLogicalIndex(this.collabStart);
        let endPosition: TextPosition = this.owner.selectionModule.getTextPosBasedOnLogicalIndex(this.collabEnd);
        let length: number = 0;
        if (isTableInsert) {
            if(action === 'BackSpace' || action === 'Delete' || action === 'Insert') {
                table = startPosition.paragraph.associatedCell.ownerTable.combineWidget(this.owner.viewer) as TableWidget;
                let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
                this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, table).position;
                if(endPosition.currentWidget.paragraph.isInsideTable) {
                    lastPara = this.documentHelper.getLastParagraphBlock(endPosition.currentWidget.paragraph.associatedCell.ownerTable);
                    lastLine = lastPara.lastChild as LineWidget;
                    endoffset = (lastPara.lastChild as LineWidget).getEndOffset();
                } else {
                    lastLine = endPosition.currentWidget;
                    endoffset = endPosition.offset;
                }
            } else {
                table = this.owner.selectionModule.start.paragraph.associatedCell.ownerTable.combineWidget(this.owner.viewer) as TableWidget;
                lastPara = this.documentHelper.getLastParagraphBlock(table);
                lastLine = lastPara.lastChild as LineWidget;
                endoffset = (lastPara.lastChild as LineWidget).getEndOffset();
            }
            startLine = this.documentHelper.getFirstParagraphBlock(table).firstChild as LineWidget;
            startOffset = 0;
            length = this.owner.selectionModule.getBlockLength(undefined, table, 0, { done: false }, true, undefined, undefined);
        } else {
            startLine = startPosition.currentWidget;
            lastLine = endPosition.currentWidget;
            endoffset = issamePosition ? (action == 'BackSpace' ? endPosition.offset : endPosition.offset + 1) : endPosition.offset;
            startOffset = issamePosition ? (action === 'BackSpace' ? startPosition.offset - 1 : startPosition.offset) : startPosition.offset;
            let startIndex: number = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(this.collabStart);
            let endIndex: number = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(this.collabEnd);
            length = endIndex - startIndex;
        }
        this.pasteContent = this.owner.sfdtExportModule.write((this.owner.documentEditorSettings.optimizeSfdt ? 1 : 0), startLine, startOffset, lastLine, endoffset, false, true);
        return this.getPasteOpertion(this.pasteContent, length);
    }

    private getPasteOpertion(pasteContent: string, length: number): Operation {
        let pasteOperation: Operation = {
            action: 'Insert',
            offset: this.startIndex,
            length: length > 0 ? length : 1,
            pasteContent: JSON.stringify(pasteContent),
            type: 'Paste'
        }
        if (this.owner.enableTrackChanges) {
            pasteOperation.markerData = { isSkipTracking: true };
        }
        return pasteOperation;
    }

    // Builds the Table and Row operation.
    private buildTableRowCellOperation(action: Action): Operation[] {
        let operations: Operation[] = [];
        if (this.insertedNodes.length > 0) {
            if(this.insertedNodes[0] instanceof TableRowWidget) {
                let row: TableRowWidget= this.insertedNodes[0] as TableRowWidget;
                let paragraphInfo: ParagraphInfo = { 'paragraph':  null, 'offset': 0 };
                this.insertIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, this.insertedNodes[0] as TableRowWidget).position;
                let length: number = this.insertedNodes.length;
                if(row.ownerTable.childWidgets.length === row.indexInOwner + length) {
                    this.insertIndex -= 1;
                }
            }
            if (this.insertedNodes.length > 1 && action === 'InsertTable') {
                let enterOperation: Operation = this.getInsertOperation('Enter', false, true);
                if (isNullOrUndefined(enterOperation.markerData)) {
                    enterOperation.markerData = {};
                }
                enterOperation.markerData.isSkipTracking = true;
                operations.push(enterOperation);
            }
            for (let i: number = 0; i < this.insertedNodes.length; i++) {
                if (this.insertedNodes[i] instanceof TableWidget) {
                    let tableWidget: TableWidget = (this.insertedNodes[i] as TableWidget).combineWidget(this.owner.viewer) as TableWidget;
                    this.tableRelatedLength = action === 'InsertTableBelow' ? 0 : 1;
                    this.insertedText = CONTROL_CHARACTERS.Table;
                    let tableFormat: any = this.owner.sfdtExportModule ? this.owner.sfdtExportModule.writeTableFormat(tableWidget.tableFormat, 0) : {};
                    this.format = JSON.stringify(tableFormat);
                    operations.push(this.getInsertOperation(action, false, true));
                    for (let j: number = 0; j < tableWidget.childWidgets.length; j++) {
                        let row: TableRowWidget = tableWidget.childWidgets[j] as TableRowWidget;
                        operations.push(this.buildRowOperation(row, action));
                        for (let k: number = 0; k < row.childWidgets.length; k++) {
                            let cell: TableCellWidget = row.childWidgets[k] as TableCellWidget;
                            let cellOperations: Operation[] = this.buildCellOperation(cell, action, true);
                            for (let l: number = 0; l < cellOperations.length; l++) {
                                operations.push(cellOperations[l]);
                            }
                        }
                    }
                } else if (this.insertedNodes[i] instanceof TableRowWidget) {
                    let row: TableRowWidget = this.insertedNodes[i] as TableRowWidget;
                    operations.push(this.buildRowOperation(row, action));
                    for (let j: number = 0; j < row.childWidgets.length; j++) {
                        let cell: TableCellWidget = row.childWidgets[j] as TableCellWidget;
                        let cellOperations: Operation[] = this.buildCellOperation(cell, action, true);
                        for (let l: number = 0; l < cellOperations.length; l++) {
                            operations.push(cellOperations[l]);
                        }
                    }
                } 	
	            else if(this.insertedNodes[i] instanceof TableCellWidget) {
                    let cell: TableCellWidget = this.insertedNodes[i] as TableCellWidget;
                    let table: TableWidget = cell.ownerTable.combineWidget(this.owner.viewer) as TableWidget;
                    let num: number = 0;
                    for(let j: number = 0; j < table.childWidgets.length; j++) {
                        i = this.insertedNodes.length;
                        let row: TableRowWidget = table.childWidgets[j] as TableRowWidget;
                        for(let k: number = 0; k < row.childWidgets.length; k++) {
                            let cell: TableCellWidget = row.childWidgets[k] as TableCellWidget;
                            let paragraphInfo: ParagraphInfo = { 'paragraph':  null, 'offset': 0 };
                            if(this.insertedNodes.indexOf(cell) !== -1) {
                                let offset: number = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, cell).position;
                                this.insertIndex = offset - num;
                                if(cell.ownerTable.childWidgets.length === cell.ownerRow.indexInOwner + 1) {
                                    if(this.insertedNodes.indexOf(row.childWidgets[row.childWidgets.length - 1]) !== -1) {
                                        this.insertIndex -= 1;
                                    }
                                }
                                let cellOperations: Operation[] = this.buildCellOperation(cell, action, true);
                                for (let l: number = 0; l < cellOperations.length; l++) {
                                    operations.push(cellOperations[l]);
                                }
                                num += 2;
                            } else {
                                let offset: number = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, cell).position;
                                this.insertIndex = offset - num;
                                let cellOperations: Operation[] = this.buildCellOperation(cell, action, false);
                                for (let l: number = 0; l < cellOperations.length; l++) {
                                    operations.push(cellOperations[l]);
                                }
                            }
                        }
                    }
                }
            }
            this.insertedNodes = [];
        }
        return operations;
    }

    private assignRevisionData(type: string, author: string, date: string, revisionId: string): MarkerInfo {
        let markerData: MarkerInfo = {
            revisionType: type,
            author: author,
            date: date,
            revisionId: revisionId
        }
        return markerData;
    }

    private createAcceptRejectOperation(action: Action): void {
        let start: TextPosition = this.owner.selectionModule.start;
        if (!start.paragraph.isInsideTable) {
            return;
        }
        let row: TableRowWidget = start.paragraph.associatedCell.ownerRow;
        let length: number = 0;
        this.insertedText = CONTROL_CHARACTERS.Row;
        if(row.rowFormat.revisions.length > 0) {
            let revision: Revision = row.rowFormat.revisions[0];
            let isAcceptOrReject: string;
            if (action === 'Accept Change') {
                isAcceptOrReject = 'Accept';
            } else if (action === 'Reject Change') {
                isAcceptOrReject = 'Reject';
            }
            this.markerData.push(this.owner.editorModule.getMarkerData(undefined, undefined, revision, isAcceptOrReject));
        }
        let paragraphInfo: ParagraphInfo = { 'paragraph':  null, 'offset': 0 };
        let offset: number = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, row).position;
        if(row.rowFormat.revisions.length > 0) {
            if(row.rowFormat.revisions[0].revisionType === 'Insertion') {
                if(action === 'Accept Change') {
                    this.startIndex = offset;
                    this.tableRelatedLength = 1;
                    this.cellOperation.push(this.getFormatOperation(undefined, 'RemoveRowTrack'));
                } else if(action === 'Reject Change') {
                    this.startIndex = offset;
                    for(let j: number = 0; j < row.childWidgets.length; j++) {
                        length += this.owner.selectionModule.calculateCellLength(row.childWidgets[j] as TableCellWidget) + 1;
                    }
                    this.tableRelatedLength = length;
                    this.cellOperation.push(this.getDeleteOperation('RemoveRowTrack'));
                }
            } else if (row.rowFormat.revisions[0].revisionType === 'Deletion') {
                if(action === 'Accept Change') {
                    this.startIndex = offset;
                    // this.tableRelatedLength = 0;
                    for(let j: number = 0; j < row.childWidgets.length; j++) {
                        length += this.owner.selectionModule.calculateCellLength(row.childWidgets[j] as TableCellWidget) + 1;
                    }
                    this.tableRelatedLength = length;
                    this.cellOperation.push(this.getDeleteOperation('RemoveRowTrack'));
                } else if(action === 'Reject Change') {
                    this.startIndex = offset;
                    for(let j: number = 0; j < row.childWidgets.length; j++) {
                        length += this.owner.selectionModule.calculateCellLength(row.childWidgets[j] as TableCellWidget) + 1;
                    }
                    this.tableRelatedLength = length;
                    this.cellOperation.push(this.getFormatOperation(undefined, 'RemoveRowTrack'));
                }
            }
            this.markerData = [];
        }
    }

    private buildRowOperation(row: TableRowWidget, action: Action): Operation {
        this.insertedText = CONTROL_CHARACTERS.Row;
        let rowFormat: any = {};
        if (!isNullOrUndefined(this.owner.sfdtExportModule)) {
            this.owner.sfdtExportModule.assignRowFormat(rowFormat, row.rowFormat, 0);
        }
        this.format = JSON.stringify(rowFormat);
        if (action === 'InsertTable' && row.rowFormat.revisions.length > 0) {
            let revision: Revision = row.rowFormat.revisions[row.rowFormat.revisions.length - 1];
            let lastRevision: MarkerInfo = this.markerData[this.markerData.length - 1];
            if (!(!isNullOrUndefined(lastRevision) && lastRevision.revisionId === revision.revisionID)) {
                this.markerData.push(this.owner.editorModule.getMarkerData(undefined, undefined, revision));
            }
        }
        this.tableRelatedLength = 1;
        let operation: Operation = this.getInsertOperation(action);
        this.format = undefined;
        return operation
    }
    /**
     * @private
     */
    public buildRowOperationForTrackChanges(row: TableRowWidget, action?: Action): Operation {
        let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
        let length: number = 0;
        let offset: number = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, row).position;
        this.startIndex = offset;
        for (let j: number = 0; j < row.childWidgets.length; j++) {
            length += this.owner.selectionModule.calculateCellLength(row.childWidgets[j] as TableCellWidget) + 1;
        }
        this.tableRelatedLength = length;
        this.insertedText = CONTROL_CHARACTERS.Row;
        let operation: Operation = this.getFormatOperation(undefined, action);
        this.insertedText = '';
        return operation;
    }

    private buildCellOperation(cell: TableCellWidget, action: Action, isCellInserted: boolean): Operation[] {
        let operations: Operation[] = [];
        this.tableRelatedLength = isCellInserted ? 1 : 0;
        this.insertedText = CONTROL_CHARACTERS.Cell;
        this.type = 'CellFormat';
        let cellFormat: any = !isNullOrUndefined(this.owner.sfdtExportModule) ? this.owner.sfdtExportModule.writeCellFormat(cell.cellFormat, 0) : {};
        this.format = JSON.stringify(cellFormat);
        operations.push(this.getInsertOperation(action, false, true));
        if (!isCellInserted) {
            return operations;
        }
        this.tableRelatedLength = isCellInserted ? 1 : 0;
        this.type = 'ParagraphFormat';
        let paragraphFormat: any = this.owner.sfdtExportModule.writeParagraphFormat((cell.childWidgets[0] as ParagraphWidget).paragraphFormat, 0, true);
        this.format = JSON.stringify(paragraphFormat);
        operations.push(this.getInsertOperation(action, false, true));
        this.tableRelatedLength = 0;
        this.type = 'CharacterFormat';
        let characterData: any = this.owner.sfdtExportModule.writeCharacterFormat((cell.childWidgets[0] as ParagraphWidget).characterFormat, 0, true);
        this.format = JSON.stringify(characterData);
        operations.push(this.getInsertOperation(action, false, true));
        this.format = undefined;
        this.type = undefined;
        return operations;
    }

    private deleteColumnOperation(action: Action): void {
        let startCell: TableCellWidget = this.owner.editorModule.getOwnerCell(this.owner.selectionModule.isForward);
        let endCell: TableCellWidget = this.owner.editorModule.getOwnerCell(!this.owner.selectionModule.isForward);
        let table: TableWidget = startCell.ownerTable.combineWidget(this.owner.viewer) as TableWidget;
        let deleteCells: TableCellWidget[] = [];
        let rowStartIndex: number = 0;
        let count: number = 0;
        if(action === 'DeleteColumn') {
            deleteCells = table.getColumnCellsForSelection(startCell, endCell);
        } else {
            let start: number = this.owner.selectionModule.getCellLeft(startCell.ownerRow, startCell);
            let end: number = start + startCell.cellFormat.cellWidth;
            let endCellLeft: number = this.owner.selectionModule.getCellLeft(endCell.ownerRow, endCell);
            let endCellRight: number = endCellLeft + endCell.cellFormat.cellWidth;
            let cellInfo: CellInfo = this.owner.editorModule.updateSelectedCellsInTable(start, end, endCellLeft, endCellRight);
            start = cellInfo.start;
            end = cellInfo.end;
            count = table.childWidgets.indexOf(endCell.ownerRow);
            rowStartIndex = table.childWidgets.indexOf(startCell.ownerRow);
            for (let i: number = rowStartIndex; i <= count; i++) {
                let row: TableRowWidget = table.childWidgets[i] as TableRowWidget;
                for (let j: number = 0; j < row.childWidgets.length; j++) {
                    let cell: TableCellWidget = row.childWidgets[j] as TableCellWidget;
                    let cellStart: number = this.owner.selectionModule.getCellLeft(row, cell);
                    if (HelperMethods.round(start, 2) <= HelperMethods.round(cellStart, 2)
                        && HelperMethods.round(cellStart, 2) < HelperMethods.round(end, 2)) {
                        deleteCells.push(cell);
                    }
                }
            }
        }
        let isRowSelect: boolean = this.owner.selectionModule.isRowSelect() && rowStartIndex != count;
        for (let i: number = 0; i < deleteCells.length; i++) {
            if (action === 'ClearCells') {
                this.deleteCell(action, deleteCells[i], false);
            } else if (action === 'MergeCells') {
                if (i !== 0) {
                    let isRowOffset: boolean = isRowSelect && (!deleteCells[0].ownerRow.equals(deleteCells[i].ownerRow)) && deleteCells[i].index == 0;
                    this.deleteCell(action, deleteCells[i], isRowOffset);
                }
            } else {
                this.deleteCell('DeleteColumn', deleteCells[i], false);
            }
        }
        if (action === 'MergeCells') {
            this.cellOperation.reverse();
            this.deleteCell('ClearCells', deleteCells[0], false);
        }
    }

    private getPasteMergeOperation(): Operation {
        let cell: TableCellWidget = this.owner.selectionModule.start.paragraph.associatedCell;
        let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
        let offset: number = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, cell).position;
        let length: number = this.owner.selectionModule.calculateCellLength(cell) - 1;
        let firstParagraph: ParagraphWidget = this.owner.selectionModule.getFirstParagraph(cell);
        let lastParagraph: ParagraphWidget = this.owner.selectionModule.getLastParagraph(cell);
        let startline: LineWidget = firstParagraph.firstChild as LineWidget;
        let lastLine: LineWidget = lastParagraph.lastChild as LineWidget;
        this.pasteContent = this.owner.sfdtExportModule.write((this.owner.documentEditorSettings.optimizeSfdt ? 1 : 0), startline, 0, lastLine, lastLine.getEndOffset(), false, true);
        this.startIndex = offset + 1;
        let pasteOperation: Operation = {
            action: 'Insert',
            offset: this.startIndex,
            length: length,
            pasteContent: JSON.stringify(this.pasteContent),
            type: 'Paste'
        }
        this.insertedText = CONTROL_CHARACTERS.Cell;
        this.type = 'CellFormat';
        this.startIndex = offset;
        this.endIndex = offset;
        this.format = JSON.stringify(this.owner.sfdtExportModule.writeCellFormat(cell.cellFormat, 0));
        return pasteOperation;
    }

    private deleteCell(action: Action, cell: TableCellWidget, isRowDelete: boolean): void {
        this.tableRelatedLength = this.owner.selectionModule.calculateCellLength(cell) + 1;
        let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
        this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, cell).position;
        this.startIndex  -= isRowDelete ? 1 : 0;
        this.tableRelatedLength += isRowDelete ? 1 : 0; 
        if (!this.owner.enableTrackChanges) {
            if (action === 'ClearCells') {
                let block: BlockWidget = cell.childWidgets[0] as BlockWidget;
                if (cell.childWidgets.length === 1 && block instanceof ParagraphWidget && (block as ParagraphWidget).isEmpty()) {
                    return;
                }
                this.endIndex = this.startIndex + this.tableRelatedLength - 1;
                this.startIndex += 1;
                this.cellOperation.push(this.getDeleteOperation('ClearCells'));
            } else {
                this.cellOperation.push(this.getDeleteOperation('DeleteColumn'));
            }
        }
    }
    /**
     * @private
     * @returns {Operation}
     */
    public getFormatOperation(element?: ElementBox, action?: string, skipIncrement?: boolean): Operation {
        if (this.startIndex > this.endIndex) {
            let temp: number = this.startIndex;
            this.startIndex = this.endIndex;
            this.endIndex = temp;
        }
        let length: number = 0;
        if (this.endIndex === this.startIndex && !skipIncrement && this.action !== 'DeleteBookmark' && this.action !== 'RemoveEditRange' && this.action !== 'InsertHyperlink') {
            if(this.action === 'BackSpace') {
                this.startIndex--;
            } else {
                this.endIndex++;
            }
        }
        if (action === 'RemoveRowTrack') {
            length = this.tableRelatedLength;
        } else if (action === 'RowResizing' || action === 'CellResizing' || action === 'ImageResizing') {
            length = this.insertedText.length;
        } else {
            length = !isNullOrUndefined(element) ? element.length : this.endIndex - this.startIndex;
        }
        let formatOperation: Operation = {
            action: 'Format',
            offset: this.startIndex,
            length: length,
            markerData: this.markerData[this.markerData.length - 1],
            imageData: this.insertedData,
            text: this.insertedText,
            format: this.format
        };
        this.markerData.pop();
        if (!isNullOrUndefined(action)) {
            formatOperation.type = action.toString();
        } else {
            formatOperation.type = this.type;
        }
        return formatOperation;
    }
    private getRemovedText(element?: IWidget): string {
        let text: string = '';
        if (!isNullOrUndefined(element)) {
            let node: IWidget = element;
            if (node instanceof ParagraphWidget) {
                text += this.getParagraphText(node as ParagraphWidget);
            } else if (node instanceof ElementBox) {
                if (node instanceof TextElementBox) {
                    text += node.text;
                } else {
                    text += ElementBox.objectCharacter;
                }
            } else if (node instanceof TableWidget) {
                text += this.getTableText(node as TableWidget);
            } else if (node instanceof TableRowWidget) {
                text += this.getRowText(node as TableRowWidget);
            }
        } else {
            for (let i: number = this.removedNodes.length - 1; i >= 0; i--) {
                let node: IWidget = this.removedNodes[i];
                if (node instanceof ParagraphWidget) {
                    text += this.getParagraphText(node as ParagraphWidget);
                } else if (node instanceof ElementBox) {
                    if (node instanceof TextElementBox) {
                        text += node.text;
                    } else {
                        text += ElementBox.objectCharacter;
                    }
                } else if (node instanceof TableWidget) {
                    text += this.getTableText(node as TableWidget);
                } else if (node instanceof TableRowWidget) {
                    text += this.getRowText(node as TableRowWidget);
                }
            }
        }
        return text;
    }

    private getRevisionOperation(revision: Revision): Operation {
        if (revision.revisionType === 'Insertion') {
            // Accept operation - Insertion
            this.markerData.push(this.owner.editorModule.getMarkerData(undefined, undefined, revision, 'Accept'));
            return this.getFormatOperation();
        } else if (revision.revisionType === 'Deletion') {
            // Reject operation - Deletion
            this.markerData.push(this.owner.editorModule.getMarkerData(undefined, undefined, revision, 'Reject'));
            return this.getFormatOperation();
        }
        return {};
    }

    private getRemovedFieldCode(): string {
        let fieldCode: string = '';
        let isStarted: boolean = false;
        for (let i: number = this.removedNodes.length - 1; i >= 0; i--) {
            let node: IWidget = this.removedNodes[i];
            if (node instanceof ElementBox) {
                if (node instanceof FieldElementBox && (node as FieldElementBox).fieldType === 0) {
                    isStarted = true;
                }
                if (node && node instanceof TextElementBox) {
                    if(isStarted) {
                        fieldCode += node.text; 
                    }
                }
                if (node instanceof FieldElementBox
                    && ((node as FieldElementBox).fieldType === 2 || (node as FieldElementBox).fieldType === 1)) {
                    return fieldCode;
                }
            }
            else if (node instanceof ParagraphWidget) {
                for (let i = 0; i < node.childWidgets.length; i++) {
                    const lineWidget: LineWidget = node.childWidgets[i] as LineWidget;
                    for (let j = 0; j < lineWidget.children.length; j++) {
                        const element: ElementBox = lineWidget.children[j];
                        if (element instanceof FieldElementBox && (element as FieldElementBox).fieldType === 0) {
                            isStarted = true;
                        }
                        if (element instanceof TextElementBox) {
                            if(isStarted) {
                                fieldCode += element.text; 
                            }
                        }
                        if (element instanceof FieldElementBox
                            && ((element as FieldElementBox).fieldType === 2 || (element as FieldElementBox).fieldType === 1)) {
                            return fieldCode;
                        }
                    }
                }
            }
        }
        return undefined;
    }

    //  Add for loop to iterate paragraph child elements and get text 
    private getParagraphText(paragraph: ParagraphWidget): string {
        let text: string = '';
        if (!isNullOrUndefined(paragraph) && !isNullOrUndefined(paragraph.childWidgets)) {
            for (let i: number = 0; i < paragraph.childWidgets.length; i++) {
                let line: LineWidget = paragraph.childWidgets[i] as LineWidget;
                for (let j: number = 0; j < line.children.length; j++) {
                    if (line.children[j] instanceof TextElementBox) {
                        text += (line.children[j] as TextElementBox).text;
                    } else {
                        text += ElementBox.objectCharacter;
                    }
                }
            }
            return text + '\n';
        }
        return text;
    }

    //  Add for loop to iterate table child elements and get text
    private getTableText(table: TableWidget): string {
        let text: string = '';
        for (let i: number = 0; i < table.childWidgets.length; i++) {
            let row: TableRowWidget = table.childWidgets[i] as TableRowWidget;
            text += this.getRowText(row);
        }
        return text;
    }

    // Add for loop to iterate table row child elements and get text
    private getRowText(row: TableRowWidget): string {
        let text: string = '';
        for (let j: number = 0; j < row.childWidgets.length; j++) {
            let cell: TableCellWidget = row.childWidgets[j] as TableCellWidget;
            for (let k: number = 0; k < cell.childWidgets.length; k++) {
                let block: BlockWidget = cell.childWidgets[k] as BlockWidget;
                if (block instanceof ParagraphWidget) {
                    text += this.getParagraphText(block as ParagraphWidget);
                } else {
                    text += this.getTableText(block as TableWidget);
                }
            }
        }
        return text;
    }

    /**
     * @private
     * @returns {Operation}
     */
    public getCommentOperation(operation: Operation, action: Action, comment?: CommentElementBox): Operation {
        if (action === 'InsertInline' || action === 'RemoveInline') {
            let commentRangeElement: CommentCharacterElementBox = action === 'RemoveInline' ? this.removedNodes[0] as CommentCharacterElementBox : this.insertedElement as CommentCharacterElementBox;
            let commentElement: CommentElementBox = commentRangeElement.comment;
            operation.text = commentRangeElement.commentType === 0 ? CONTROL_CHARACTERS.Marker_Start : CONTROL_CHARACTERS.Marker_End;
            operation.markerData = {
                type: 'Comment',
                commentId: commentRangeElement.commentId,
                ownerCommentId: commentElement.isReply ? commentElement.ownerComment.commentId : undefined
            }
        } else if (action === 'InsertCommentWidget' || action === 'DeleteCommentWidget') {
            if (isNullOrUndefined(comment)) {
                comment = this.removedNodes[0] as CommentElementBox;
            }
            operation.length = 1;
            operation.action = 'Format';
            operation.offset = undefined;
            operation.text = CONTROL_CHARACTERS.Marker_Start + CONTROL_CHARACTERS.Marker_End;
            operation.markerData = {
                type: 'Comment',
                commentId: comment.commentId,
                author: comment.author,
                date: comment.date,
                commentIndex: comment.isReply ? comment.ownerComment.replyComments.indexOf(comment) : this.owner.documentHelper.comments.indexOf(comment),
                initial: comment.initial,
                done: comment.isResolved,
                text: comment.text,
                isReply: comment.isReply
            }
            if (!isNullOrUndefined(comment.ownerComment)) {
                // Get the position of the comment owner offset
                let position: TextPosition = this.owner.selection.getElementPosition(comment.ownerComment.commentEnd, true).startPosition;
                operation.offset = this.owner.selectionModule.getAbsolutePositionFromRelativePosition(position);
            }
            if (action === 'DeleteCommentWidget') {
                operation.offset = this.startIndex < this.endIndex ? this.endIndex : this.startIndex;
                // To get the offset of end comment element box we are seperating minus one to it. 
                operation.offset -= 1;
                operation.markerData.commentAction = 'remove';
            } else if (action === 'InsertCommentWidget') {
                operation.markerData.commentAction = 'add';
            }
        } else if (action === 'ResolveComment') {
            operation.action = 'Format';
            operation.length = 1;
            operation.text = CONTROL_CHARACTERS.Marker_Start + CONTROL_CHARACTERS.Marker_End;
            operation.offset = this.startIndex < this.endIndex ? this.endIndex : this.startIndex;
            // To get the offset of end comment element box we are seperating minus one to it.
            operation.offset -= 1;
            operation.markerData = {
                type: 'Comment',
                commentId: comment.commentId,
                done: comment.isResolved
            }
        } else if (action === 'EditComment') {
            operation.action = 'Format';
            operation.length = 1;
            operation.text = CONTROL_CHARACTERS.Marker_Start + CONTROL_CHARACTERS.Marker_End;
            operation.offset = this.startIndex < this.endIndex ? this.endIndex : this.startIndex;
            // To get the offset of end comment element box we are seperating minus one to it.
            operation.offset -= 1;
            operation.markerData = {
                type: 'Comment',
                text: comment.text,
            }
        }
        return operation;
    }
    /**
     * @private
     */
    public getDeleteCommentOperation(modifiedActions: BaseHistoryInfo[], operations: Operation[]) {
        for (let i = 0; i < modifiedActions.length; i++) {
            let currentHistory = modifiedActions[i];
            if (currentHistory instanceof HistoryInfo && (currentHistory.action === 'DeleteComment')) {
                this.getDeleteCommentOperation(currentHistory.modifiedActions, operations);
            } else {
                let operation: Operation = currentHistory.getDeleteOperation(currentHistory.action);
                currentHistory.getCommentOperation(operation, currentHistory.action);
                if (currentHistory.action === 'DeleteCommentWidget' && !isNullOrUndefined(modifiedActions[i + 1])) {
                    // For update operation we need end offset. So taking the offset from end remove inline history.
                    let updateHistory = modifiedActions[i + 1];
                    operation.offset = updateHistory.startIndex < updateHistory.endIndex ? updateHistory.startIndex : updateHistory.endIndex;
                }
                operations.push(operation);
            }
        }
    }

    /**
     * @private
     * @returns {Operation}
     */
    public buildFormatOperation(action: Action, ischarFormat: boolean): Operation[] {
        let operations: Operation[] = [];
        if ((action === 'ApplyStyle' || action === 'StyleName') && this.insertedFormat instanceof WParagraphStyle) {
            this.insertedFormat = (this.insertedFormat as WParagraphStyle).name;
            this.type = 'ParagraphFormat';
            this.createParagraphFormat(action);
        } else {
            if (action === 'ApplyStyle' || action === 'StyleName') {
                this.insertedFormat = (this.insertedFormat as WCharacterStyle).name;
            }
            if (ischarFormat) {
                this.type = 'CharacterFormat';
                this.createCharacterFormat(action);
            } else {
                this.type = action == 'ContinueNumbering' ? 'ContinueNumbering' : 'ParagraphFormat';
                this.createParagraphFormat(action);
            }
        }
        operations = this.getSelectedCellOperation(action, ischarFormat);
        this.format = undefined;
        return operations;
    }

    /**
     * @private
     * @returns {Operation}
     */
    public getSelectedCellOperation(action: Action, ischarFormat?: boolean, isBorder?: boolean, isShading?: boolean, isCell?: boolean): Operation[] {
        let operations: Operation[] = [];
        let start: TextPosition = this.owner.selectionModule.start;
        let end: TextPosition = this.owner.selectionModule.end;
        if (start.paragraph.isInsideTable && end.paragraph.isInsideTable && (start.paragraph.associatedCell.ownerTable.equals(end.paragraph.associatedCell.ownerTable)
            && this.owner.selectionModule.isCellSelected(start.paragraph.associatedCell, start, end))) {
            let selectCells: TableCellWidget[] = this.owner.selectionModule.getSelectedCells();
            for (let i: number = 0; i < selectCells.length; i++) {
                let cell: TableCellWidget = selectCells[i] as TableCellWidget;
                let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
                this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, cell).position;
                // Plus one is for cell index
                let length: number = this.owner.selectionModule.calculateCellLength(cell) + 1;
                this.endIndex = this.startIndex + length;
                if (length === 0 && ischarFormat) {
                    continue;
                }
                if(this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
                    if (!isNullOrUndefined(this.owner.sfdtExportModule)) {
                        let cellFormat: any = this.owner.sfdtExportModule.writeCellFormat(cell.cellFormat, 0);
                        this.format = JSON.stringify(cellFormat);
                    }
                } else {
                    this.writeBorderFormat(isBorder, isShading, cell);
                }
                let formatOperation: Operation;
                if (action === 'ListFormat') {
                    formatOperation = this.getFormatOperation(undefined, undefined, true);
                    formatOperation.type = 'ListFormat';
                    this.createListFormat(action, formatOperation);
                } else {
                    formatOperation = this.getFormatOperation(undefined, undefined, true);
                }
                operations.push(formatOperation);
            }
        } else {
            let operation: Operation;
            if (action === 'ListFormat') {
                operation = this.getFormatOperation(undefined, undefined, true);
                operation.type = 'ListFormat';
                this.createListFormat(action, operation);
            } else {
                if (start.paragraph.isInsideTable && isCell) {
                    let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
                    this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, start.paragraph.associatedCell).position;
                    let length: number = this.owner.selectionModule.calculateCellLength(start.paragraph.associatedCell) + 1;
                    this.endIndex = this.startIndex + length;
                    this.writeBorderFormat(isBorder, isShading, start.paragraph.associatedCell);
                }
                operation = this.getFormatOperation(undefined, undefined, true);
            }
            operations.push(operation);
        }
        return operations;
    }

    private writeBorderFormat(isBorder: boolean, isShading: boolean, cell: TableCellWidget): void {
        let cellFormat: any = {};
        if (isBorder) {
            cellFormat['borders'] = HelperMethods.writeBorders(cell.cellFormat.borders, 0);
            this.format = JSON.stringify(cellFormat);
        }
        if (isShading) {
            cellFormat['shading'] = this.owner.sfdtExportModule ? this.owner.sfdtExportModule.writeShading(cell.cellFormat.shading, 0) : {};
            this.format = JSON.stringify(cellFormat);
        }
    }

    private createListFormat(action: Action, operation: Operation): void {
        let listId: number;
        let nsid: number;
        if (action === 'ListFormat') {
           listId = (this.insertedFormat as WListFormat).listId;
           operation.text = action.toString().charAt(0).toLowerCase() + action.toString().slice(1);
        } else {
            listId = (<any>this.insertedFormat).listId;
            nsid = (<any>this.insertedFormat).nsid;
        }
        if (listId > -1) {
            let list: WList = this.owner.documentHelper.getListById(listId);
            let listData: any = {};
            listData.optimizeSfdt = this.owner.documentEditorSettings.optimizeSfdt;
            if (!isNullOrUndefined(this.owner.sfdtExportModule)) {
                this.owner.sfdtExportModule.keywordIndex = this.owner.documentEditorSettings.optimizeSfdt ? 1 : 0;
                listData[listsProperty[this.owner.sfdtExportModule.keywordIndex]] = [];
                listData[listsProperty[this.owner.sfdtExportModule.keywordIndex]].push(this.owner.sfdtExportModule.writeList(list));
                listData[abstractListsProperty[this.owner.sfdtExportModule.keywordIndex]] = [];
                if (!isNullOrUndefined(list)) {
                    listData[abstractListsProperty[this.owner.sfdtExportModule.keywordIndex]].push(this.owner.sfdtExportModule.writeAbstractList(list.abstractList));
                }
                if (action == 'RestartNumbering') {
                    listData[listIdProperty[this.owner.sfdtExportModule.keywordIndex]] = listId;
                    listData[nsidProperty] = nsid;
                }
            }
            operation.listData = JSON.stringify(listData);
        }
    }

    private createCharacterFormat(action: Action): void {
        let characterFormat: any = {};
        if (action === 'Uppercase') {
            characterFormat.Uppercase = true;
        }else if (action === 'Lowercase') {
            characterFormat.Lowercase = true;
        }else if (action === 'SentenceCase') {
            characterFormat.SentenceCase = true;
        }else if (action === 'ToggleCase') {
            characterFormat.ToggleCase = true;
        }else if (action === 'CapitalizeEachWord') {
            characterFormat.CapitalizeEachWord = true;
        } else if (action === 'ApplyStyle' || action === 'StyleName') {
            characterFormat.styleName = this.insertedFormat;
        } else if (action === 'CharacterFormat') {
            let charFormat: WCharacterFormat = this.insertedFormat as WCharacterFormat;
            characterFormat.bold = charFormat.hasValue('bold') ? charFormat.bold : characterFormat.bold;
            characterFormat.italic = charFormat.hasValue('italic') ? charFormat.italic : characterFormat.italic;
            characterFormat.fontSize = charFormat.hasValue('fontSize') ? charFormat.fontSize : characterFormat.fontSize;
            characterFormat.underline = charFormat.hasValue('underline') ? charFormat.underline : characterFormat.underline;
            characterFormat.strikethrough = charFormat.hasValue('strikethrough') ? charFormat.strikethrough : characterFormat.strikethrough;
            characterFormat.baselineAlignment = charFormat.hasValue('baselineAlignment') ? charFormat.baselineAlignment : characterFormat.baselineAlignment;
            characterFormat.highlightColor = charFormat.hasValue('highlightColor') ? charFormat.highlightColor : characterFormat.highlightColor;
            characterFormat.fontColor = charFormat.hasValue('fontColor') ? charFormat.fontColor : characterFormat.fontColor;
            characterFormat.fontFamily = charFormat.hasValue('fontFamily') ? charFormat.fontFamily : characterFormat.fontFamily;
            characterFormat.allCaps = charFormat.hasValue('allCaps') ? charFormat.allCaps : characterFormat.allCaps;
            characterFormat.LowerCase = charFormat.hasValue('Lowercase') ? charFormat.Lowercase : characterFormat.Lowercase;
            characterFormat.Uppercase = charFormat.hasValue('Uppercase') ? charFormat.Lowercase : characterFormat.Uppercase;
            characterFormat.CapitalizeEachWord = charFormat.hasValue('CapitalizeEachWord') ? charFormat.CapitalizeEachWord : characterFormat.CapitalizeEachWord;
            characterFormat.SentenceCase = charFormat.hasValue('SentenceCase') ? charFormat.SentenceCase : characterFormat.SentenceCase;
            characterFormat.ToggleCase = charFormat.hasValue('ToggleCase') ? charFormat.ToggleCase : characterFormat.ToggleCase;
        } else {
            if (this.insertedFormat === 'increment' || this.insertedFormat === 'decrement') {
                this.type = this.insertedFormat as string;
                characterFormat.fontSize = 0;
            } else {
                if (action !== 'ClearFormat') {
                    let text: any = action.toString().charAt(0).toLowerCase() + action.toString().slice(1);
                    if (this.insertedFormat instanceof WCharacterFormat && (this.editorHistory.isUndoing || this.editorHistory.isRedoing)) {
                        this.insertedFormat = this.insertedFormat[text];
                    }
                    characterFormat[text] = this.insertedFormat;
                }
            }
        }
        this.format = JSON.stringify(characterFormat);
    }
    private createParagraphFormat(action: Action): void {
        let paragraphFormat: any = {};
        if (action === 'ParagraphFormat' || action === 'ContinueNumbering') {
            let paraFormat: WParagraphFormat = this.insertedFormat as WParagraphFormat;
            paragraphFormat.afterSpacing = paraFormat.hasValue('afterSpacing') ? paraFormat.afterSpacing : paragraphFormat.afterSpacing;
            paragraphFormat.beforeSpacing = paraFormat.hasValue('beforeSpacing') ? paraFormat.beforeSpacing : paragraphFormat.beforeSpacing;
            paragraphFormat.spaceAfterAuto = paraFormat.hasValue('spaceAfterAuto') ? paraFormat.spaceAfterAuto : paragraphFormat.spaceAfterAuto;
            paragraphFormat.spaceBeforeAuto = paraFormat.hasValue('spaceBeforeAuto') ? paraFormat.spaceBeforeAuto : paragraphFormat.spaceBeforeAuto;
            paragraphFormat.rightIndent = paraFormat.hasValue('rightIndent') ? paraFormat.rightIndent : paragraphFormat.rightIndent;
            paragraphFormat.leftIndent = paraFormat.hasValue('leftIndent') ? paraFormat.leftIndent : paragraphFormat.leftIndent;
            paragraphFormat.firstLineIndent = paraFormat.hasValue('firstLineIndent') ? paraFormat.firstLineIndent : paragraphFormat.firstLineIndent;
            paragraphFormat.lineSpacing = paraFormat.hasValue('lineSpacing') ? paraFormat.lineSpacing : paragraphFormat.lineSpacing;
            paragraphFormat.lineSpacingType = paraFormat.hasValue('lineSpacingType') ? paraFormat.lineSpacingType : paragraphFormat.lineSpacingType;
            paragraphFormat.textAlignment = paraFormat.hasValue('textAlignment') ? paraFormat.textAlignment : paragraphFormat.textAlignment;
            paragraphFormat.outlineLevel = paraFormat.hasValue('outlineLevel') ? paraFormat.outlineLevel : paragraphFormat.outlineLevel;
            paragraphFormat.bidi = paraFormat.hasValue('bidi') ? paraFormat.bidi : paragraphFormat.bidi;
            if (paragraphFormat.bidi) {
                if (paragraphFormat.textAlignment === 'Right') {
                    paragraphFormat.textAlignment = 'Left';
                }
                else if (paragraphFormat.textAlignment === 'Left') {
                    paragraphFormat.textAlignment = 'Right';
                }
            }
            paragraphFormat.borders = paraFormat.hasValue('borders') ? paraFormat.borders : paragraphFormat.borders;
            if (paraFormat.listFormat.listId !== -1) {
                let listFormat: any = {};
                listFormat.listId = paraFormat.listFormat.listId;
                listFormat.listLevelNumber = paraFormat.listFormat.listLevelNumber;
                listFormat.nsid = paraFormat.listFormat.nsid;
                paragraphFormat.listFormat = listFormat;
            }
            paragraphFormat.styleName = paraFormat.hasValue('styleName') ? paragraphFormat.styleName.name : undefined;
            paragraphFormat.contextualSpacing = paraFormat.hasValue('contextualSpacing') ? paraFormat.contextualSpacing : paragraphFormat.contextualSpacing;
            paragraphFormat.keepWithNext = paraFormat.hasValue('keepWithNext') ? paraFormat.keepWithNext : paragraphFormat.keepWithNext;
            paragraphFormat.keepLinesTogether = paraFormat.hasValue('keepLinesTogether') ? paraFormat.keepLinesTogether : paragraphFormat.keepLinesTogether;
            paragraphFormat.widowControl = paraFormat.hasValue('contextualSpacing') ? paraFormat.widowControl : paragraphFormat.widowControl;
        } else if (action === 'ListFormat') {
            if (this.insertedFormat instanceof WParagraphFormat) {
                this.insertedFormat = this.insertedFormat.listFormat
            }
            let listFormat: any = {};
            listFormat.listId = (this.insertedFormat as WListFormat).listId;
            listFormat.nsid = (this.insertedFormat as WListFormat).nsid;
            listFormat.listLevelNumber = (this.insertedFormat as WListFormat).listLevelNumber;
            paragraphFormat.listFormat = listFormat;
        } else if (action === 'ApplyStyle' || action === 'StyleName') {
            paragraphFormat.styleName = this.insertedFormat;
        } else if (action === 'ParagraphBidi') {
            paragraphFormat.bidi = this.insertedFormat;
        } else if (action === 'Borders') {
            paragraphFormat['borders'] = HelperMethods.writeBorders(this.insertedFormat as WBorders, 0);
        } else {
            if (this.insertedFormat instanceof WParagraphFormat) {
                let paraFormat: any = this.owner.sfdtExportModule.writeParagraphFormat(this.insertedFormat as WParagraphFormat, 0);
                paragraphFormat[action.toString().charAt(0).toLowerCase() + action.toString().slice(1)] = paraFormat;
            } else if (action === 'List') {
                paragraphFormat = this.insertedFormat;
            } else {
                paragraphFormat[action.toString().charAt(0).toLowerCase() + action.toString().slice(1)] = this.insertedFormat;
            }
        }
        this.format = JSON.stringify(paragraphFormat);
    }
    /**
     * @private
     * @returns {void}
     */
    public createTableFormat(action: Action): void {
        let paragraphInfo: ParagraphInfo = { 'paragraph': null, 'offset': 0 };
        this.startIndex = this.owner.selectionModule.getPositionInfoForHeaderFooter(paragraphInfo, { position: 0, done: false }, this.owner.selectionModule.start.paragraph.associatedCell.ownerTable).position;
        this.endIndex = this.startIndex
        this.endIndex += this.owner.selectionModule.getBlockLength(undefined, this.owner.selectionModule.start.paragraph.associatedCell.ownerTable.combineWidget(this.owner.viewer) as TableWidget, 0, { done: false }, true, undefined, undefined) - 1;
        let tableFormat: any = {};
        if (action === 'TableFormat') {
            let tabFormat: WTableFormat = this.insertedFormat as WTableFormat
            if (!isNullOrUndefined(tabFormat)) {
                tableFormat.bidi = tabFormat.hasValue('bidi') ? tabFormat.bidi : undefined;
                tableFormat.preferredWidth = tabFormat.hasValue('preferredWidth') ? tabFormat.preferredWidth : undefined;
                tableFormat.preferredWidthType = tabFormat.hasValue('preferredWidthType') ? tabFormat.preferredWidthType : undefined;
                tableFormat.tableAlignment = tabFormat.hasValue('tableAlignment') ? tabFormat.tableAlignment : undefined;
                tableFormat.leftIndent = tabFormat.hasValue('leftIndent') ? tabFormat.leftIndent : undefined;
            }
        } else if (action === 'TableOptions') {
            let tableOption: WTableFormat = this.owner.selectionModule.start.paragraph.associatedCell.ownerTable.tableFormat;
            if (!isNullOrUndefined(tableOption)) {
                tableFormat.cellSpacing = tableOption.hasValue('cellSpacing') ? tableOption.cellSpacing : undefined;
                tableFormat.leftMargin = tableOption.hasValue('leftMargin') ? tableOption.leftMargin : undefined;
                tableFormat.topMargin = tableOption.hasValue('topMargin') ? tableOption.topMargin : undefined;
                tableFormat.rightMargin = tableOption.hasValue('rightMargin') ? tableOption.rightMargin : undefined;
                tableFormat.bottomMargin = tableOption.hasValue('bottomMargin') ? tableOption.bottomMargin : undefined;
            }
        } else if (action === 'BordersAndShading') {
            let tabBorderFormat: WTableFormat = this.insertedFormat as WTableFormat;
            tableFormat = !isNullOrUndefined(this.owner.sfdtExportModule) ? this.owner.sfdtExportModule.writeTableFormat(tabBorderFormat, 0) : {};
        } else {
            tableFormat[this.getTableFormatString(action)] = this.insertedFormat;
        }
        this.format = JSON.stringify(tableFormat);
    }
    /**
     * @private
     * @returns {void}
     */
    public createRowFormat(action: Action): void {
        let rowFormat: any = {};
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            if (!isNullOrUndefined(this.owner.sfdtExportModule)) {
                this.owner.sfdtExportModule.assignRowFormat(rowFormat, this.owner.selectionModule.start.paragraph.associatedCell.ownerRow.rowFormat, 0);
            }
        } else {
            if (action === 'RowFormat') {
                let rForamt: WRowFormat = this.insertedFormat as WRowFormat;
                if (!isNullOrUndefined(rForamt)) {
                    rowFormat.height = rForamt.hasValue('height') ? rForamt.height : undefined;
                    rowFormat.heightType = rForamt.hasValue('heightType') ? rForamt.heightType : undefined;
                    rowFormat.isHeader = rForamt.hasValue('isHeader') ? rForamt.isHeader : undefined;
                    rowFormat.allowBreakAcrossPages = rForamt.hasValue('allowBreakAcrossPages') ? rForamt.allowBreakAcrossPages : undefined;
                }
            } else {
                rowFormat[this.getRowString(action)] = this.insertedFormat;
            }
        }
        this.format = JSON.stringify(rowFormat);
    }
    /**
     * @private
     * @returns {void}
     */
    public createCellFormat(action: Action): void {
        let cellFormat: any = {};
        if(action === 'CellFormat') {
            let cFormat: WCellFormat = this.insertedFormat as WCellFormat;
            cellFormat.preferredWidth = cFormat.hasValue('preferredWidth') ? cFormat.preferredWidth : undefined;
            cellFormat.preferredWidthType = cFormat.hasValue('preferredWidthType') ? cFormat.preferredWidthType : undefined;
            cellFormat.verticalAlignment = cFormat.hasValue('verticalAlignment') ? cFormat.verticalAlignment : undefined;
        } else if(action === 'CellOptions') {
            let cellOption: WCellFormat = this.insertedFormat as WCellFormat;
            cellFormat.leftMargin = cellOption.leftMargin;
            cellFormat.rightMargin = cellOption.rightMargin;
            cellFormat.bottomMargin = cellOption.bottomMargin;
            cellFormat.topMargin = cellOption.topMargin;
        } else if (action === 'Shading') {
            cellFormat[this.getCellString(action)] = !isNullOrUndefined(this.owner.sfdtExportModule) ? this.owner.sfdtExportModule.writeShading(this.insertedFormat as WShading, 0) : {};
        } else if (action === 'Borders') {
            cellFormat['borders'] = HelperMethods.writeBorders(this.insertedFormat as WBorders, 0);
        } else if (action === 'BordersAndShading') {
            cellFormat['shading'] = !isNullOrUndefined(this.owner.sfdtExportModule) ? this.owner.sfdtExportModule.writeShading(this.insertedFormat as WShading, 0) : {};
            cellFormat['borders'] = HelperMethods.writeBorders((this.insertedFormat as WCellFormat).borders as WBorders, 0);
        } else {
            cellFormat[this.getCellString(action)] = this.insertedFormat;
        }
        this.format = JSON.stringify(cellFormat);
    }

    private getTableFormatString(property: Action): string {
        switch (property) {
            case 'TableAlignment':
                return 'tableAlignment';
            case 'TableLeftIndent':
                return 'leftIndent';
            case 'DefaultCellLeftMargin':
                return 'leftMargin';
            case 'DefaultCellRightMargin':
                return 'rightMargin';
            case 'DefaultCellBottomMargin':
                return 'bottomMargin';
            case 'DefaultCellTopMargin':
                return 'topMargin';
            case 'TablePreferredWidth':
                return 'preferredWidth';
            case 'TablePreferredWidthType':
                return 'preferredWidthType';
            case 'Shading':
                return 'shading';
            case 'TableBidi':
                return 'bidi';
            default:
                return 'cellSpacing';
        }
    }
    private createSectionFormat(action: Action): void {
        let sectionFormat: any = {};
        if (this.editorHistory.isUndoing || this.editorHistory.isRedoing) {
            if (!isNullOrUndefined(this.owner.sfdtExportModule)) {
                this.owner.sfdtExportModule.writeSectionFormat(this.owner.selectionModule.start.paragraph.bodyWidget.sectionFormat, sectionFormat, 0);
            }
        } else {
            if (action === 'LinkToPrevious') {
                const headerFooterWidget: HeaderFooterWidget = this.owner.selectionModule.start.paragraph.bodyWidget as HeaderFooterWidget;
                let sectionIndex: number = headerFooterWidget.sectionIndex;
                let headerFooterType: HeaderFooterType = headerFooterWidget.headerFooterType;
                this.format = JSON.stringify({ linkToPrevious: this.insertedFormat, sectionIndex: sectionIndex, headerFooterType: headerFooterType});
                return;
            } else if (action === 'SectionFormat') {
                let secFormat: WSectionFormat = this.insertedFormat as WSectionFormat;
                this.owner.sfdtExportModule.writeSectionFormat(secFormat, sectionFormat, 0);
            } else {
                sectionFormat[action[0].toLowerCase() + action.slice(1)] = this.insertedFormat;
            }
        }
        this.format = JSON.stringify(sectionFormat);
    }

    private getRowString(property: Action): string {
        switch (property) {
            case 'RowHeight':
                return 'height';
            case 'RowHeightType':
                return 'heightType';
            case 'RowHeader':
                return 'isHeader';
            default:
                return 'allowBreakAcrossPages';
        }
    }

    private getCellString(property: Action): string{
        switch(property) {
            case 'CellContentVerticalAlignment':
                return 'verticalAlignment';
            case 'CellLeftMargin':
                return 'leftMargin';
            case 'CellRightMargin':
                return 'rightMargin';
            case 'CellBottomMargin':
                return 'bottomMargin';
            case 'CellTopMargin':
                return 'topMargin';
            case 'CellPreferredWidth':
                return 'preferredWidth';
            case 'Shading':
                return 'shading';
            default:
                return 'cellPreferredWidthType';
        }
    }
}



/**
 * Specifies the operation that is performed in Document Editor.
 * > Reserved for internal use only.
 */
export interface Operation {
    /**
     * Reserved for internal use only.
     */
    action?: 'Insert' | 'Delete' | 'Format' | 'Update',
    /**
     * Reserved for internal use only.
     */
    offset?: number,
    /**
     * Reserved for internal use only.
     */
    text?: string,
    /**
     * Reserved for internal use only.
     */
    length?: number,
    /**
     * Reserved for internal use only.
     */
    skipOperation?: boolean,
    /**
     * Reserved for internal use only.
     */
    imageData?: ImageInfo,
    /**
     * Reserved for internal use only.
     */
    type?: string,
    /**
     * Reserved for internal use only.
     */
    markerData?: MarkerInfo,
    /**
     * Reserved for internal use only.
     */
    protectionData?: ProtectionInfo,
    /**
     * Reserved for internal use only.
     */
    enableTrackChanges?: boolean,
    /**
     * Reserved for internal use only.
     */
    pasteContent?: string,
    /**
     * Reserved for internal use only.
     */
    styleData?: string,
    /**
     * Reserved for internal use only.
     */
    listData?: string,
    /**
     * Reserved for internal use only.
     */
    format?: string
}

/**
 * Specifies the information about the image data.
 * > Reserved for internal use only.
 */
export interface ImageInfo {
    /**
     * Reserved for internal use only.
     */
    imageString?: string,
    /**
     * Reserved for internal use only.
     */
    height?: number,
    /**
     * Reserved for internal use only.
     */
    width?: number,
    /**
     * Reserved for internal use only.
     */
    alternativeText?: string
    /**
     * Reserved for internal use only.
     */
    metaString?: string
}

/**
 * Specifies the information about marker elements.
 * > Reserved for internal use only.
 */
export interface MarkerInfo {
    /**
     * Reserved for internal use only.
     */
    bookmarkName?: string,
    /**
     * Reserved for internal use only.
     */
    type?: string,
    /**
     * Reserved for internal use only.
     */
    user?: string,
    /**
     * Reserved for internal use only.
     */
    editRangeId?: number,
    /**
     * Reserved for internal use only.
     */
    skipOperation?: boolean,
    /**
     * Reserved for internal use only.
     */
    columnFirst?: string,
    /**
     * Reserved for internal use only.
     */
    columnLast?: string,
    /**
     * Reserved for internal use only.
     */
    isAfterParagraphMark?: boolean,
    /**
     * Reserved for internal use only.
     */
    isAfterTableMark?: boolean,
    /**
     * Reserved for internal use only.
     */
    isAfterRowMark?: boolean,
    /**
     * Reserved for internal use only.
     */
    isAfterCellMark?: boolean,
    /**
     * Reserved for internal use only.
     */
    formFieldData?: string,
    /**
     * Reserved for internal use only.
     */
    checkBoxValue?: boolean,
    /**
     * Reserved for internal use only.
     */
    commentId?: string,
    /**
     * Reserved for internal use only.
     */
    author?: string,
    /**
     * Reserved for internal use only.
     */
    date?: string,
    /**
     * Reserved for internal use only.
     */
    initial?: string,
    /**
     * Reserved for internal use only.
     */
    done?: boolean,
    /**
     * Reserved for internal use only.
     */
    commentIndex?: number,
    /**
     * Reserved for internal use only.
     */
    commentAction?: string,
    /**
     * Reserved for internal use only.
     */
    text?: string,
    /**
     * Reserved for internal use only.
     */
    ownerCommentId?: string,
    /**
     * Reserved for internal use only.
     */
    isReply?: boolean,
    /**
     * Reserved for internal use only.
     */
    revisionId?: string,
    /**
     * Reserved for internal use only.
     */
    revisionType?: string,
    /**
     * Reserved for internal use only.
     */
    isAcceptOrReject?: string,
    /**
     * Reserved for internal use only.
     */
    splittedRevisions?: MarkerInfo[],
    /**
     * Reserved for internal use only.
     */
    removedIds?: string[],
    /**
     * Reserved for internal use only.
     */
    dropDownIndex?: number,
    /**
     * Reserved for internal use only.
     */
    isSkipTracking?: boolean,
    /**
     * Reserved for internal use only.
     */
    revisionForFootnoteEndnoteContent?: MarkerInfo
}
/**
 * Specifies the information about the protection type.
 * > Reserved for internal use.
 */
export interface ProtectionInfo {
    /**
     * Reserved for internal use only.
     */
    saltValue?: string,
    /**
     * Reserved for internal use only.
     */
    hashValue?: string,
    /**
     * Reserved for internal use only.
     */
    protectionType?: ProtectionType
}