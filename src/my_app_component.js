/// <reference path="../typings/angular2/angular2.d.ts" />
/// <reference path="../node_modules/immutable/dist/immutable.d.ts" />
if (typeof __decorate !== "function") __decorate = function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
if (typeof __metadata !== "function") __metadata = function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var angular2_1 = require("angular2/angular2");
var di_1 = require("angular2/di");
var immutable_1 = require("immutable");
var dialog_1 = require("dialog");
var ItemRecord = immutable_1.Record({ text: null, columnId: null, isTemp: null });
function item(text, columnId, isTemp) {
    if (isTemp === void 0) { isTemp = false; }
    return new ItemRecord({ text: text, columnId: columnId, isTemp: isTemp });
}
var ColumnRecord = immutable_1.Record({ id: null, name: null, items: null });
function column(id, name, items) {
    return new ColumnRecord({ id: id, name: name, items: items });
}
var BoardStore = (function () {
    function BoardStore() {
        this.columns = immutable_1.List.of(column(1, "todo", immutable_1.List.of(item('todo:one', 1), item('todo:two', 1))), column(2, "in-progress", immutable_1.List.of(item('in-progress:one', 2), item('in-progress:two', 2))), column(3, "done", immutable_1.List.of(item('done:one', 3), item('done:two', 3))));
    }
    BoardStore.prototype.removeItem = function (item) {
        var columnIndex = this.columns.findIndex(function (c) { return c.id === item.columnId; });
        var itemIndex = this.columns.get(columnIndex).items.indexOf(item);
        if (itemIndex == -1)
            throw "tried to remove and item with text " + item.text + " and columnId " + item.columnId;
        this.columns = this.columns.removeIn([columnIndex, 'items', itemIndex]);
    };
    BoardStore.prototype.moveItem = function (item, destinationColumnId, insertAfter) {
        console.assert(insertAfter === null || insertAfter.columnId === destinationColumnId);
        var targetColumn = this.columns.filter(function (c) { return c.id === destinationColumnId; }).first();
        var index = insertAfter === null ? 0 : targetColumn.items.indexOf(insertAfter);
        this.removeItem(item);
        this.addItem(item, destinationColumnId, index);
    };
    BoardStore.prototype.addAfter = function (item, destinationColumnId, addAfter) {
        var targetColumn = this.columns.filter(function (c) { return c.id === destinationColumnId; }).first();
        var index = addAfter === null ? targetColumn.items.size : targetColumn.items.indexOf(addAfter);
        this.addItem(item, destinationColumnId, index);
    };
    BoardStore.prototype.addItem = function (item, destinationColumnId, index) {
        var columnIndex = this.columnIdToIdx(destinationColumnId);
        var newItem = item.setIn(['columnId'], destinationColumnId);
        this.columns = this.columns.updateIn([columnIndex, 'items'], function (items) { return items.splice(index, 0, newItem); });
    };
    BoardStore.prototype.columnIdToIdx = function (id) {
        return this.columns.findIndex(function (c) { return c.id === id; });
    };
    return BoardStore;
})();
var ItemActions = (function () {
    function ItemActions(board) {
        this.board = board;
    }
    ItemActions.prototype.removeItem = function (item) { this.board.removeItem(item); };
    ItemActions.prototype.moveItem = function (item, destinationColumndId, insertAfter) {
        this.board.moveItem(item, destinationColumndId, insertAfter);
    };
    ItemActions.prototype.addItemAfter = function (item, destinationColumnId, addAfter) {
        this.board.addAfter(item, destinationColumnId, addAfter);
    };
    ItemActions = __decorate([
        di_1.Injectable(), 
        __metadata('design:paramtypes', [BoardStore])
    ], ItemActions);
    return ItemActions;
})();
var DragService = (function () {
    function DragService(actions) {
        this.actions = actions;
        this._draggingItem = null;
        this._draggingOver = null;
        this._draggingOverColumn = null;
        this._tempEl = null;
    }
    DragService.prototype.setDragging = function (item) {
        this._draggingItem = item;
    };
    DragService.prototype.dragOver = function (columnId, overItem) {
        console.log('over', columnId, overItem);
        if (this._draggingItem == null || this._tempEl == overItem) {
            return;
        }
        this._draggingOver = overItem;
        this._draggingOverColumn = columnId;
        if (this._tempEl)
            this.actions.removeItem(this._tempEl);
        this._tempEl = item(this._draggingItem.text, columnId, true);
        this.actions.addItemAfter(this._tempEl, this._draggingOverColumn, this._draggingOver);
    };
    DragService.prototype.dragEnd = function () {
        if (this._draggingItem == null || this._draggingOverColumn == null)
            return;
        this.actions.removeItem(this._tempEl);
        this._tempEl = null;
        this.actions.moveItem(this._draggingItem, this._draggingOverColumn, this._draggingOver);
        this._draggingItem = null;
        this._draggingOver = null;
        this._draggingOverColumn = null;
    };
    DragService = __decorate([
        di_1.Injectable(), 
        __metadata('design:paramtypes', [ItemActions])
    ], DragService);
    return DragService;
})();
var EditItemCmp = (function () {
    function EditItemCmp() {
    }
    EditItemCmp = __decorate([
        angular2_1.Component({
            selector: 'edit-item-cmp'
        }),
        angular2_1.View({
            template: "hello"
        }), 
        __metadata('design:paramtypes', [])
    ], EditItemCmp);
    return EditItemCmp;
})();
var ItemCmp = (function () {
    function ItemCmp(actions, mdDialog, el, inj) {
        this.actions = actions;
        this.mdDialog = mdDialog;
        this.el = el;
        this.inj = inj;
    }
    ItemCmp.prototype.edit = function () {
        this.mdDialog.open(EditItemCmp, this.el, this.inj);
    };
    ItemCmp.prototype.remove = function () { this.actions.removeItem(this.item); };
    ItemCmp = __decorate([
        angular2_1.Component({
            selector: 'item',
            changeDetection: angular2_1.ON_PUSH,
            properties: {
                item: 'item'
            }
        }),
        angular2_1.View({
            template: "\n    Item: {{item.text}}\n    <button (click)=\"remove()\">x</button>\n    <button (click)=\"edit()\">Edit</button>\n   "
        }), 
        __metadata('design:paramtypes', [ItemActions, dialog_1.MdDialog, angular2_1.ElementRef, di_1.Injector])
    ], ItemCmp);
    return ItemCmp;
})();
exports.ItemCmp = ItemCmp;
var ColumnCmp = (function () {
    function ColumnCmp(drag) {
        this.drag = drag;
    }
    ColumnCmp = __decorate([
        angular2_1.Component({
            selector: 'column',
            changeDetection: angular2_1.ON_PUSH,
            properties: {
                column: 'column'
            },
            hostListeners: {
                dragover: 'drag.dragOver(column.id, null)'
            }
        }),
        angular2_1.View({
            directives: [angular2_1.coreDirectives, ItemCmp],
            template: "\n    <h1>{{column.name}}</h1>\n    <item *ng-for=\"#i of column.items\" [item]=\"i\" draggable=\"true\"\n       (dragstart)=\"drag.setDragging(i)\" (dragend)=\"drag.dragEnd()\" (dragover)=\"drag.dragOver(column.id, i)\"\n       [class.temp]=\"i.isTemp\"></item>\n  "
        }), 
        __metadata('design:paramtypes', [DragService])
    ], ColumnCmp);
    return ColumnCmp;
})();
exports.ColumnCmp = ColumnCmp;
var BoardCmp = (function () {
    function BoardCmp() {
    }
    BoardCmp = __decorate([
        angular2_1.Component({
            selector: 'board',
            changeDetection: angular2_1.ON_PUSH,
            properties: {
                columns: 'columns'
            }
        }),
        angular2_1.View({
            directives: [angular2_1.coreDirectives, ColumnCmp],
            template: "\n    <h1>Kanban</h1>\n    <column *ng-for=\"#c of columns\" [column]=\"c\"></column>\n  "
        }), 
        __metadata('design:paramtypes', [])
    ], BoardCmp);
    return BoardCmp;
})();
exports.BoardCmp = BoardCmp;
var KanbanApp = (function () {
    function KanbanApp(board) {
        this.board = board;
        window.b = board;
    }
    KanbanApp = __decorate([
        angular2_1.Component({
            selector: 'my-app',
            injectables: [BoardStore, ItemActions, DragService, dialog_1.MdDialog]
        }),
        angular2_1.View({
            directives: [BoardCmp],
            template: '<board [columns]="board.columns"></board>'
        }), 
        __metadata('design:paramtypes', [BoardStore])
    ], KanbanApp);
    return KanbanApp;
})();
exports.KanbanApp = KanbanApp;
