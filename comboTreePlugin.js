/*!
 * jQuery ComboTree Plugin 
 * Author:  Erhan FIRAT
 * Mail:    erhanfirat@gmail.com
 * Licensed under the MIT license
 */


;(function ( $, window, document, undefined ) {
    
    // Create the defaults once
    var comboTreePlugin = 'comboTree',
        defaults = {
            source: [], 
            isMultiple: false,
            callbacks: {
                onOpen: null,
                onClose: null,
                onItemClick: null,
                onInitialized: null
            },
            renderItem: null,
            slideDuration: 500,
            autoUnselectChildren: true,
            autoSelectParent: true,
        };

    // The actual plugin constructor
    function ComboTree( element, options ) {
        this.elemInput = element;
        this._elemInput = $(element);

        this.options = $.extend( {}, defaults, options) ;
        
        this._defaults = defaults;
        this._name = comboTreePlugin;
        this._isOpened = false;
        
        this.init();
    }

    ComboTree.prototype.init = function () {
        // VARIABLES
        this._selectedItem = {};
        this._selectedItems = [];

        // Setting Doms
        this.comboTreeId = 'comboTree' + Math.floor(Math.random() * 999999);

        this._elemInput.addClass('comboTreeInputBox');

        if(this._elemInput.attr('id') === undefined)
            this._elemInput.attr('id', this.comboTreeId + 'Input');
        this.elemInputId = this._elemInput.attr('id');

        this._elemInput.wrap('<div id="'+ this.comboTreeId + 'Wrapper" class="comboTreeWrapper"></div>');
        this._elemInput.wrap('<div id="'+ this.comboTreeId + 'InputWrapper" class="comboTreeInputWrapper"></div>');
        this._elemWrapper = $('#' + this.comboTreeId + 'Wrapper');

        this._elemArrowBtn = $('<button id="' + this.comboTreeId + 'ArrowBtn" class="comboTreeArrowBtn"><span class="comboTreeArrowBtnImg">▼</span></button>');
        this._elemInput.after(this._elemArrowBtn);
        this._elemWrapper.append('<div id="' + this.comboTreeId + 'DropDownContainer" class="comboTreeDropDownContainer"><div class="comboTreeDropDownContent"></div>');
        
        // DORP DOWN AREA
        this._elemDropDownContainer = $('#' + this.comboTreeId + 'DropDownContainer');
        this._elemDropDownContainer.html(this.createSourceHTML());
        
        this._elemItems = this._elemDropDownContainer.find('li');
        this._elemItemsTitle = this._elemDropDownContainer.find('span.comboTreeItemTitle');

        // ~

        this.bindings();

        if (typeof this.options.callbacks.onInitialized === 'function') {
            this.options.callbacks.onInitialized();
        }

        this.refreshInputVal();
    };



    // *********************************
    // SOURCES CODES
    // *********************************

    ComboTree.prototype.removeSourceHTML = function () {
        this._elemDropDownContainer.html('');
    };

    ComboTree.prototype.createSourceHTML = function () {
        var htmlText = this.createSourceSubItemsHTML(this.options.source);
        return htmlText;
    };

    ComboTree.prototype.createSourceSubItemsHTML = function (subItems) {
        var subItemsHtml = '<ul>';
        for (var i=0; i<subItems.length; i++){
            subItemsHtml += this.createSourceItemHTML(subItems[i]);
        }
        subItemsHtml += '</ul>'
        return subItemsHtml;
    }

    ComboTree.prototype.createSourceItemHTML = function (sourceItem) {
        var itemHtml = "",
            isThereSubs = sourceItem.hasOwnProperty("subs");
        
        itemHtml = '<li class="ComboTreeItem' + (isThereSubs?'Parent':'Chlid') + '"> ';
        
        if (isThereSubs) {
            itemHtml += '<span class="comboTreeParentPlus">&minus;</span>';
        }

        var checked = '';

        if (sourceItem.selected === true) {
            checked =  'checked="checked"';
            this._selectedItems.push(sourceItem);
        }

        if (typeof this.options.renderItem === 'function') {
            itemHtml += this.options.renderItem(sourceItem);
        } else {
            if (this.options.isMultiple) {
                itemHtml += '<span data-id="' + sourceItem.id + '" class="comboTreeItemTitle"><input type="checkbox" ' + checked + '>' + sourceItem.title + '</span>';
            } else {
                itemHtml += '<span data-id="' + sourceItem.id + '" class="comboTreeItemTitle">' + sourceItem.title + '</span>';
            }
        }

        if (isThereSubs) {
            itemHtml += this.createSourceSubItemsHTML(sourceItem.subs);
        }
        
        itemHtml += '</li>';
        return itemHtml;
    };


    // BINDINGS
    // *****************************
    ComboTree.prototype.bindings = function () {
        var _this = this;

        this._elemArrowBtn.on('click', function(e){
            e.stopPropagation();
            _this.toggleDropDown();
        });
        this._elemInput.on('click', function(e){
            e.stopPropagation();
            if (!_this._elemDropDownContainer.is(':visible'))
                _this.toggleDropDown();
        });
        this._elemItems.on('click', function(e){
            e.stopPropagation();
            if ($(this).hasClass('ComboTreeItemParent')){
                _this.toggleSelectionTree(this);
            }
        });        
        this._elemItemsTitle.on('click', function(e){
            e.stopPropagation();
            if (_this.options.isMultiple)
                _this.multiItemClick(this, e);
            else
                _this.singleItemClick(this);
        });
        this._elemItemsTitle.on("mousemove", function (e) {
            e.stopPropagation();
            _this.dropDownMenuHover(this);
        });

        // KEY BINDINGS
        this._elemInput.on('keyup', function(e) {
            e.stopPropagation();

            switch (e.keyCode) {
                case 27:
                    _this.closeDropDownMenu(); break;
                case 13:                  
                case 39: case 37: case 40: case 38:
                    e.preventDefault(); 
                    break;
                default: 
                    if (!_this.options.isMultiple)
                        _this.filterDropDownMenu(); 
                    break;
            }
        });
        this._elemInput.on('keydown', function(event) {
            event.stopPropagation();

            switch (event.keyCode) {
            case 9:
                _this.closeDropDownMenu(); break;
            case 40: case 38:
                event.preventDefault();
                _this.dropDownInputKeyControl(event.keyCode - 39); break;
            case 37: case 39:
                event.preventDefault();
                _this.dropDownInputKeyToggleTreeControl(event.keyCode - 38);
                break;
            case 13:
                if (_this.options.isMultiple)
                    _this.multiItemClick(_this._elemHoveredItem, event);
                else
                    _this.singleItemClick(_this._elemHoveredItem);
                event.preventDefault();
                break;
            default: 
                if (_this.options.isMultiple)
                    event.preventDefault();
        }
        });
        // ON FOCUS OUT CLOSE DROPDOWN
        $(document).on('mouseup.' + _this.comboTreeId, function (event){
            if (!_this._elemWrapper.is(event.target) && _this._elemWrapper.has(event.target).length === 0 && _this._elemDropDownContainer.is(':visible'))
                _this.closeDropDownMenu();
        });
    };




    // EVENTS HERE 
    // ****************************

    // DropDown Menu Open/Close
    ComboTree.prototype.toggleDropDown = function () {

        if (this._isOpened) {
            this._elemDropDownContainer.slideUp(this.options.slideDuration);
            this._isOpened = false;

            if (typeof this.options.callbacks.onClose === 'function') {
                this.options.callbacks.onClose();
            }
        } else {
            this._elemDropDownContainer.slideDown(this.options.slideDuration);
            this._isOpened = true;

            if (typeof this.options.callbacks.onOpen === 'function') {
                this.options.callbacks.onOpen();
            }

            this._elemInput.focus();
        }
    };
    ComboTree.prototype.closeDropDownMenu = function () {
        if (this._isOpened) {
            this._elemDropDownContainer.slideUp(this.options.slideDuration);
            this._isOpened = false;

            if (typeof this.options.callbacks.onClose === 'function') {
                this.options.callbacks.onClose();
            }
        }
    };
    // Selection Tree Open/Close
    ComboTree.prototype.toggleSelectionTree = function (item, direction) {
        var subMenu = $(item).children('ul')[0];
        if (direction === undefined){
            if ($(subMenu).is(':visible'))
                $(item).children('span.comboTreeParentPlus').html("+");
            else
                $(item).children('span.comboTreeParentPlus').html("&minus;");

            $(subMenu).slideToggle(50);
        }
        else if (direction == 1 && !$(subMenu).is(':visible')){
                $(item).children('span.comboTreeParentPlus').html("&minus;");
                $(subMenu).slideDown(50);
        }
        else if (direction == -1){
            if ($(subMenu).is(':visible')){
                $(item).children('span.comboTreeParentPlus').html("+");
                $(subMenu).slideUp(50);
            }
            else {
                this.dropDownMenuHoverToParentItem(item);
            }
        }
            
    };


    // SELECTION FUNCTIONS
    // *****************************
    ComboTree.prototype.singleItemClick = function (ctItem) {
        var id = $(ctItem).attr("data-id");
        this._selectedItem = {
            id: $(ctItem).attr("data-id"),
            title: $(ctItem).text()
        };

        this.refreshInputVal();

        if (typeof this.options.callbacks.onItemClick === 'function') {
            data = {
                target: ctItem,
                $target: $(ctItem),
                selected: selected,
                id: id,
                mode: 'single',
            };
            this.options.callbacks.onItemClick(data);
        }
        
        this.closeDropDownMenu();
    };
    ComboTree.prototype.multiItemClick = function (ctItem, event) {
        var self = this;
        var id = $(ctItem).attr("data-id");
        var _selectedItem = {
            id: id,
            title: $(ctItem).text()
        };

        console.log($(ctItem).text());


        // ~

        var index = this.isItemInArray(_selectedItem, this._selectedItems);
        var selected = index !== false;

        if (!selected && this.options.autoSelectParent) {
            var child = $(ctItem).closest('ul').closest('li').find('> .comboTreeItemTitle input:not(:checked)');

            console.log('parent ', child);
            if (child.length > 0) {
                child.each(
                    function() {
                        self.multiItemClick($(this).parent()[0]);
                    }
                )
            }
        }

        if (selected) {
            this._selectedItems.splice(parseInt(index), 1);
            $(ctItem).find("input").prop('checked', false);
            console.log('[ ] ' + $(ctItem).text());
        }
        else {
            this._selectedItems.push(_selectedItem);
            $(ctItem).find("input").prop('checked', true);
            console.log('[v] ' + $(ctItem).text());
        }

        if (selected && this.options.autoUnselectChildren) {
            var children = $(ctItem).parent().find('> ul > li > .comboTreeItemTitle input:checked');

            console.log(children);
            if (children.length > 0) {
                children.each(
                    function() {
                        self.multiItemClick($(this).parent()[0]);
                    }
                )
            }
        }



        this.refreshInputVal();

        if (
            'undefined' === typeof event &&
            typeof this.options.callbacks.onItemClick === 'function'
        ) {
            data = {
                target: ctItem,
                $target: $(ctItem),
                selected: selected,
                id: id,
                mode: 'multi',
            };

            this.options.callbacks.onItemClick(data);
        }
    };

    ComboTree.prototype.isItemInArray = function (item, arr) {

        for (var i=0; i<arr.length; i++)
            if (item.id == arr[i].id && item.title == arr[i].title)
                return i + "";

        return false;
    }

    ComboTree.prototype.refreshInputVal = function () {
        var tmpTitle = "";
        
        if (this.options.isMultiple) {
            for (var i=0; i<this._selectedItems.length; i++){
                tmpTitle += this._selectedItems[i].title;
                if (i<this._selectedItems.length-1)
                    tmpTitle += ", ";
            }
        }
        else {
            tmpTitle = this._selectedItem.title;
        }

        this._elemInput.val(tmpTitle);
    }

    ComboTree.prototype.dropDownMenuHover = function (itemSpan, withScroll) {
        this._elemItems.find('span.comboTreeItemHover').removeClass('comboTreeItemHover');
        $(itemSpan).addClass('comboTreeItemHover');
        this._elemHoveredItem = $(itemSpan);
        if (withScroll)
            this.dropDownScrollToHoveredItem(this._elemHoveredItem);
    }

    ComboTree.prototype.dropDownScrollToHoveredItem = function (itemSpan) {
        var curScroll = this._elemDropDownContainer.scrollTop();
        this._elemDropDownContainer.scrollTop(curScroll + $(itemSpan).parent().position().top - 80);
    }

    ComboTree.prototype.dropDownMenuHoverToParentItem = function (item) {
        var parentSpanItem = $($(item).parents('li.ComboTreeItemParent')[0]).children("span.comboTreeItemTitle");
        if (parentSpanItem.length)
            this.dropDownMenuHover(parentSpanItem, true);
        else 
            this.dropDownMenuHover(this._elemItemsTitle[0], true);
    }

    ComboTree.prototype.dropDownInputKeyToggleTreeControl = function (direction) {
        var item = this._elemHoveredItem;
        if ($(item).parent('li').hasClass('ComboTreeItemParent'))
            this.toggleSelectionTree($(item).parent('li'), direction);
        else if (direction == -1)
            this.dropDownMenuHoverToParentItem(item);
    }

    ComboTree.prototype.dropDownInputKeyControl = function (step) {
        if (!this._elemDropDownContainer.is(":visible")) 
            this.toggleDropDown();

        var list = this._elemItems.find("span.comboTreeItemTitle:visible");
        i = this._elemHoveredItem?list.index(this._elemHoveredItem) + step:0;
        i = (list.length + i) % list.length;

        this.dropDownMenuHover(list[i], true);        
    },

    ComboTree.prototype.filterDropDownMenu = function () {
        var searchText = this._elemInput.val();
        if (searchText != ""){
            this._elemItemsTitle.hide();
            this._elemItemsTitle.siblings("span.comboTreeParentPlus").hide();
            list = this._elemItems.find("span:icontains('" + this._elemInput.val() + "')").each(function (i, elem) {
                $(this).show();
                $(this).siblings("span.comboTreeParentPlus").show();
            });    
        }
        else{
            this._elemItemsTitle.show();
            this._elemItemsTitle.siblings("span.comboTreeParentPlus").show();
        }
    }

    // Retuns Array (multiple), Integer (single), or False (No choice)
    ComboTree.prototype.getSelectedItemsId = function () {
        if (this.options.isMultiple && this._selectedItems.length>0){
            var tmpArr = [];
            for (i=0; i<this._selectedItems.length; i++)
                tmpArr.push(this._selectedItems[i].id);

            return tmpArr;
        }
        else if (!this.options.isMultiple && this._selectedItem.hasOwnProperty('id')){
            return this._selectedItem.id;
        }
        return false;
    }

    // Retuns Array (multiple), Integer (single), or False (No choice)
    ComboTree.prototype.getSelectedItemsTitle = function () {
        if (this.options.isMultiple && this._selectedItems.length>0){
            var tmpArr = [];
            for (i=0; i<this._selectedItems.length; i++)
                tmpArr.push(this._selectedItems[i].title);

            return tmpArr;
        }
        else if (!this.options.isMultiple && this._selectedItem.hasOwnProperty('id')){
            return this._selectedItem.title;
        }
        return false;
    }


    ComboTree.prototype.unbind = function () {
        this._elemArrowBtn.off('click');
        this._elemInput.off('click');
        this._elemItems.off('click');        
        this._elemItemsTitle.off('click');
        this._elemItemsTitle.off("mousemove");
        this._elemInput.off('keyup');
        this._elemInput.off('keydown');
        this._elemInput.off('mouseup.' + this.comboTreeId);
        $(document).off('mouseup.' + this.comboTreeId);
    }

    ComboTree.prototype.destroy = function () {
        this.unbind();
        this._elemWrapper.before(this._elemInput);
        this._elemWrapper.remove();
        this._elemInput.removeData('plugin_' + comboTreePlugin);
    }


    $.fn[comboTreePlugin] = function ( options) {
        var ctArr = [];
        this.each(function () {
            if (!$.data(this, 'plugin_' + comboTreePlugin)) {
               $.data(this, 'plugin_' + comboTreePlugin, new ComboTree( this, options));
               ctArr.push($(this).data()['plugin_' + comboTreePlugin]);
            }
        });

        if (this.length == 1)
            return ctArr[0];
        else
            return ctArr;
    }

})( jQuery, window, document );




