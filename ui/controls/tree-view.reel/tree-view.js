/**
 * @module ui/tree-view.reel
 */
var AbstractComponentActionDelegate = require("ui/abstract/abstract-component-action-delegate").AbstractComponentActionDelegate;

/**
 * @class TreeView
 * @extends Component
 */
exports.TreeView = AbstractComponentActionDelegate.specialize({
    _isExpanded: {
        value: null
    },

    isExpanded: {
        get: function() {
            return this._isExpanded;
        },
        set: function(isExpanded) {
            this._isExpanded = isExpanded;
            if (isExpanded) {
                if (this._controller) {
                    this._controller.open(this._selectedPath);
                }
            }
        }
    },

    _selectedPath: {
        value: null
    },

    selectedPath: {
        get: function() {
            return this._selectedPath;
        },
        set: function(selectedPath) {
            if (this._selectedPath !== selectedPath) {
                this._selectedPath = selectedPath;
            }
        }
    },

    _selectedNode: {
        value: null
    },

    selectedNode: {
        get: function() {
            return this._selectedNode;
        },
        set: function(selectedNode) {
            if (this._selectedNode !== selectedNode) {
                this._selectedNode = selectedNode;
            }
        }
    },

    _controller: {
        value: null
    },

    controller: {
        get: function() {
            return this._controller;
        },
        set: function(controller) {
            if (this._controller !== controller) {
                this._controller = controller;

                if (controller) {
                   this._setDefaultSelectedPath();
                }
            }
        }
    },

    enterDocument: {
        value: function() {
            this._setDefaultSelectedPath();
        }
    },

    exitDocument: {
        value: function() {
            this._close()
        }
    },

    handleBackButtonAction: {
        value: function () {
            if (this.controller.parent) {
                this.controller.open(this.controller.parent.path);
            }
        }
    },

    handleCancelAction: {
        value: function () {
            this._close();
        }
    },

    handleSelectAction: {
        value: function () {
            this.selectedPath = this.selectedNode;
            this.isExpanded = false;
        }
    },

    _setDefaultSelectedPath: {
        value: function() {
            if (!this._selectedPath && this._controller && this._controller.root) {
                this.selectedPath = this.selectedNode = this._controller.selectedPath;
            }
        }
    },

    _close: {
        value: function() {
            this.isExpanded = false;
            this.controller.open(this.selectedPath);
        }
    }
});
