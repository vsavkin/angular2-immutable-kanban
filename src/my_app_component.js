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
var ItemRecord = immutable_1.Record({ text: null, columnId: null });
function item(text, columnId) {
    return new ItemRecord({ text: text, columnId: columnId });
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
        this.columns = this.columns.removeIn([columnIndex, 'items', itemIndex]);
    };
    BoardStore.prototype.moveItem = function (item, destinationColumnId, insertAfter) {
        console.assert(insertAfter === null || insertAfter.columnId === destinationColumnId);
        var targetColumn = this.columns.filter(function (c) { return c.id === destinationColumnId; }).first();
        var index = insertAfter === null ? 0 : targetColumn.items.indexOf(insertAfter);
        this.removeItem(item);
        this.addItem(item, destinationColumnId, index);
    };
    BoardStore.prototype.addItem = function (item, destinationColumnId, index) {
        var columnIndex = this.columns.findIndex(function (c) { return c.id === destinationColumnId; });
        this.columns = this.columns.updateIn([columnIndex, 'items'], function (items) { return items.splice(index, 0, item); });
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
    ItemActions = __decorate([
        di_1.Injectable(), 
        __metadata('design:paramtypes', [BoardStore])
    ], ItemActions);
    return ItemActions;
})();
var ItemCmp = (function () {
    function ItemCmp(actions) {
        this.actions = actions;
    }
    ItemCmp.prototype.remove = function () { this.actions.removeItem(this.item); };
    ItemCmp.prototype.move = function () { this.actions.moveItem(this.item, 1, null); };
    ItemCmp = __decorate([
        angular2_1.Component({
            selector: 'item',
            changeDetection: angular2_1.ON_PUSH,
            properties: {
                item: 'item'
            }
        }),
        angular2_1.View({
            template: "\n    Item: {{item.text}}\n    <button (click)=\"remove()\">x</button>\n    <button (click)=\"move()\">Move</button>\n  "
        }), 
        __metadata('design:paramtypes', [ItemActions])
    ], ItemCmp);
    return ItemCmp;
})();
exports.ItemCmp = ItemCmp;
var ColumnCmp = (function () {
    function ColumnCmp() {
    }
    ColumnCmp = __decorate([
        angular2_1.Component({
            selector: 'column',
            changeDetection: angular2_1.ON_PUSH,
            properties: {
                column: 'column'
            }
        }),
        angular2_1.View({
            directives: [angular2_1.coreDirectives, ItemCmp],
            template: "\n    <h1>{{column.name}}</h1>\n    <item *ng-for=\"#i of column.items\" [item]=\"i\"></item>\n  "
        }), 
        __metadata('design:paramtypes', [])
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
            injectables: [BoardStore, ItemActions]
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
