/*!
 * jQuery ComboTree Plugin
 * Author:  Erhan FIRAT
 * Mail:    erhanfirat@gmail.com
 * Licensed under the MIT license
 * Version: 1.2.1
 */

(function ($, window, document, undefined) {
  // Default settings
  var comboTreePlugin = "comboTree",
    defaults = {
      source: [],
      isMultiple: false,
      cascadeSelect: false,
      selected: [],
      collapse: false,
      selectableLastNode: false,
      withSelectAll: false,
      isolatedSelectable: false,
    };

  // LIFE CYCLE
  function ComboTree(element, options) {
    this.options = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = comboTreePlugin;

    this.constructorFunc(element, options);
  }

  ComboTree.prototype.constructorFunc = function (element, options) {
    this.input = element;
    this._input = $(element);

    this.init();
  };

  ComboTree.prototype.init = function () {
    // Setting Doms
    this.id = "combo-tree-" + Math.floor(Math.random() * 999999);

    this._input.addClass("combo-tree-input-box");

    if (this._input.attr("id") === undefined)
      this._input.attr("id", this.id + "-input");

    this._input.wrap(
      '<div id="' + this.id + '-wrapper" class="combo-tree-wrapper"></div>'
    );
    this._input.wrap(
      '<div id="' +
        this.id +
        '-input-wrapper" class="combo-tree-input-wrapper"></div>'
    );
    this._wrapper = $("#" + this.id + "-wrapper");

    this._arrowBtn = $(
      '<button id="' +
        this.id +
        '-arrow-btn" class="combo-tree-arrow-btn" type="button"><span class="mdi mdi-chevron-down combo-tree-arrow-btnImg"></span></button>'
    );
    this._input.after(this._arrowBtn);
    this._wrapper.append(
      '<div id="' +
        this.id +
        '-drop-down-container" class="combo-tree-drop-down-container"><div class="combo-tree-drop-down-content"></div>'
    );

    // DORP DOWN AREA
    this._dropDownContainer = $("#" + this.id + "-drop-down-container");

    this._dropDownContainer.html(this.createSourceHTML());
    this._filterInput = this.options.isMultiple
      ? $("#" + this.id + "MultiFilter")
      : null;
    this._selectAllInput =
      this.options.isMultiple && this.options.withSelectAll
        ? $("#" + this.id + "SelectAll")
        : null;
    this._sourceUl = $("#" + this.id + "-source-ul");

    this._listItems = this._dropDownContainer.find("li");
    this._listItemsTitle = this._dropDownContainer.find(
      "span.combo-tree-list-item-title"
    );

    // VARIABLES
    this._selectedItem = {};
    this._selectedItems = [];

    this.processSelected();

    this.bindings();
  };

  ComboTree.prototype.unbind = function () {
    this._arrowBtn.off("click");
    this._input.off("click");
    this._listItems.off("click");
    this._listItemsTitle.off("click");
    this._listItemsTitle.off("mousemove");
    this._input.off("keyup");
    this._input.off("keydown");
    this._input.off("mouseup." + this.id);
    $(document).off("mouseup." + this.id);
  };

  ComboTree.prototype.destroy = function () {
    this.unbind();
    this._wrapper.before(this._input);
    this._wrapper.remove();
    this._input.removeData("plugin_" + comboTreePlugin);
  };

  // CREATE DOM HTMLs

  ComboTree.prototype.removeSourceHTML = function () {
    this._dropDownContainer.html("");
  };

  ComboTree.prototype.createSourceHTML = function () {
    var sourceHTML = "";
    if (this.options.isMultiple)
      sourceHTML += this.createFilterHTMLForMultiSelect();
    if (this.options.isMultiple && this.options.withSelectAll)
      sourceHTML += this.createSelectAllHTMLForMultiSelect();
    sourceHTML += this.createSourceSubItemsHTML(this.options.source);
    return sourceHTML;
  };

  ComboTree.prototype.createFilterHTMLForMultiSelect = function () {
    return (
      '<input id="' +
      this.id +
      'MultiFilter" type="text" class="multiples-filter" placeholder="Type to filter"/>'
    );
  };

  ComboTree.prototype.createSelectAllHTMLForMultiSelect = function () {
    return (
      '<label class="selectAll"><input type="checkbox" id="' +
      this.id +
      "SelectAll" +
      '">[Select All]</label>'
    );
  };

  ComboTree.prototype.createSourceSubItemsHTML = function (
    subItems,
    parentId,
    collapse = false
  ) {
    var subItemsHtml =
      '<ul id="' +
      this.id +
      "-source-ul" +
      (parentId ? parentId : "-main") +
      '" style="' +
      ((this.options.collapse || collapse) && parentId ? "display:none;" : "") +
      '">';
    for (var i = 0; i < subItems.length; i++) {
      subItemsHtml += this.createSourceItemHTML(subItems[i]);
    }
    subItemsHtml += "</ul>";
    return subItemsHtml;
  };

  ComboTree.prototype.createSourceItemHTML = function (sourceItem) {
    var itemHtml = "",
      isThereSubs = sourceItem.hasOwnProperty("subs"),
      collapse = sourceItem.hasOwnProperty("collapse")
        ? sourceItem.hasOwnProperty("collapse")
        : false;
    let isSelectable =
      sourceItem.isSelectable === undefined ? true : sourceItem.isSelectable;
    let selectableClass =
      isSelectable || isThereSubs ? "selectable" : "not-selectable";
    if (this.options.isolatedSelectable) {
      selectableClass = isSelectable ? "selectable" : "not-selectable";
    }
    let selectableLastNode =
      this.options.selectableLastNode !== undefined && isThereSubs
        ? this.options.selectableLastNode
        : false;

    itemHtml +=
      '<li id="' +
      this.id +
      "-li" +
      sourceItem.id +
      '" class="ComboTreeItem' +
      (isThereSubs ? "Parent" : "Chlid") +
      '"> ';

    if (isThereSubs)
      itemHtml +=
        '<span class="combo-tree-parent-plus">' +
        (this.options.collapse || collapse
          ? '<span class="mdi mdi-chevron-right-circle-outline"></span>'
          : '<span class="mdi mdi-chevron-down-circle-outline"></span>') +
        "</span>"; // itemHtml += '<span class="combo-tree-parent-plus">' + (this.options.collapse ? '+' : '&minus;') + '</span>';

    if (this.options.isMultiple)
      itemHtml +=
        '<span data-id="' +
        sourceItem.id +
        '" data-selectable="' +
        isSelectable +
        '" class="combo-tree-list-item-title ' +
        selectableClass +
        '">' +
        (!selectableLastNode && isSelectable
          ? '<input type="checkbox" />'
          : "") +
        sourceItem.title +
        "</span>";
    else
      itemHtml +=
        '<span data-id="' +
        sourceItem.id +
        '" data-selectable="' +
        isSelectable +
        '" class="combo-tree-list-item-title ' +
        selectableClass +
        '">' +
        sourceItem.title +
        "</span>";

    if (isThereSubs)
      itemHtml += this.createSourceSubItemsHTML(
        sourceItem.subs,
        sourceItem.id,
        collapse
      );

    itemHtml += "</li>";
    return itemHtml;
  };

  // BINDINGS

  ComboTree.prototype.bindings = function () {
    var _this = this;

    $(this._input).focus(function (e) {
      if (!_this._dropDownContainer.is(":visible"))
        $(_this._dropDownContainer).slideToggle(100);
    });

    this._arrowBtn.on("click", function (e) {
      e.stopPropagation();
      _this.toggleDropDown();
    });
    this._input.on("click", function (e) {
      e.stopPropagation();
      if (!_this._dropDownContainer.is(":visible")) _this.toggleDropDown();
    });
    this._listItems.on("click", function (e) {
      e.stopPropagation();
      if ($(this).hasClass("ComboTreeItemParent")) {
        _this.toggleSelectionTree(this);
      }
    });
    this._listItemsTitle.on("click", function (e) {
      e.stopPropagation();
      if (_this.options.isMultiple) _this.multiItemClick(this);
      else _this.singleItemClick(this);
    });
    this._listItemsTitle.on("mousemove", function (e) {
      e.stopPropagation();
      _this.dropDownMenuHover(this);
    });
    this._selectAllInput &&
      this._selectAllInput.parent("label").on("mousemove", function (e) {
        e.stopPropagation();
        _this.dropDownMenuHover(this);
      });

    // KEY BINDINGS
    this._input.on("keyup", function (e) {
      e.stopPropagation();

      switch (e.keyCode) {
        case 27:
          _this.closeDropDownMenu();
          break;
        case 13:
        case 39:
        case 37:
        case 40:
        case 38:
          e.preventDefault();
          break;
        default:
          if (!_this.options.isMultiple) _this.filterDropDownMenu();
          break;
      }
    });

    this._filterInput &&
      this._filterInput.on("keyup", function (e) {
        e.stopPropagation();

        switch (e.keyCode) {
          case 27:
            if ($(this).val()) {
              $(this).val("");
              _this.filterDropDownMenu();
            } else {
              _this.closeDropDownMenu();
            }
            break;
          case 40:
          case 38:
            e.preventDefault();
            _this.dropDownInputKeyControl(e.keyCode - 39);
            break;
          case 37:
          case 39:
            e.preventDefault();
            _this.dropDownInputKeyToggleTreeControl(e.keyCode - 38);
            break;
          case 13:
            _this.multiItemClick(_this._elemHoveredItem);
            e.preventDefault();
            break;
          default:
            _this.filterDropDownMenu();
            break;
        }
      });

    this._input.on("keydown", function (e) {
      e.stopPropagation();

      switch (e.keyCode) {
        case 9:
          _this.closeDropDownMenu();
          break;
        case 40:
        case 38:
          e.preventDefault();
          _this.dropDownInputKeyControl(e.keyCode - 39);
          break;
        case 37:
        case 39:
          e.preventDefault();
          _this.dropDownInputKeyToggleTreeControl(e.keyCode - 38);
          break;
        case 13:
          if (_this.options.isMultiple)
            _this.multiItemClick(_this._elemHoveredItem);
          else _this.singleItemClick(_this._elemHoveredItem);
          e.preventDefault();
          break;
        default:
          if (_this.options.isMultiple) e.preventDefault();
      }
    });

    // ON FOCUS OUT CLOSE DROPDOWN
    $(document).on("mouseup." + _this.id, function (e) {
      if (
        !_this._wrapper.is(e.target) &&
        _this._wrapper.has(e.target).length === 0 &&
        _this._dropDownContainer.is(":visible")
      )
        _this.closeDropDownMenu();
    });

    this._selectAllInput &&
      this._selectAllInput.on("click", function (e) {
        e.stopPropagation();
        let checked = $(e.target).prop("checked");
        if (checked) {
          _this.selectAll();
        } else {
          _this.clearSelection();
        }
      });
  };

  // EVENTS HERE

  // DropDown Menu Open/Close
  ComboTree.prototype.toggleDropDown = function () {
    const _this = this;
    $(this._dropDownContainer).slideToggle(100, function () {
      if (_this._dropDownContainer.is(":visible")) $(_this._input).focus();
    });
  };

  ComboTree.prototype.closeDropDownMenu = function () {
    $(this._dropDownContainer).slideUp(100);
  };

  // Selection Tree Open/Close
  ComboTree.prototype.toggleSelectionTree = function (item, direction) {
    var subMenu = $(item).children("ul")[0];
    if (direction === undefined) {
      if ($(subMenu).is(":visible"))
        $(item)
          .children("span.combo-tree-parent-plus")
          .html('<span class="mdi mdi-chevron-right-circle-outline"></span>');
      //$(item).children('span.combo-tree-parent-plus').html("+");
      else
        $(item)
          .children("span.combo-tree-parent-plus")
          .html('<span class="mdi mdi-chevron-down-circle-outline"></span>'); //$(item).children('span.combo-tree-parent-plus').html("&minus;");

      $(subMenu).slideToggle(50);
    } else if (direction == 1 && !$(subMenu).is(":visible")) {
      $(item)
        .children("span.combo-tree-parent-plus")
        .html('<span class="mdi mdi-chevron-down-circle-outline"></span>'); //$(item).children('span.combo-tree-parent-plus').html("&minus;");
      $(subMenu).slideDown(50);
    } else if (direction == -1) {
      if ($(subMenu).is(":visible")) {
        $(item)
          .children("span.combo-tree-parent-plus")
          .html('<span class="mdi mdi-chevron-right-circle-outline"></span>'); //$(item).children('span.combo-tree-parent-plus').html("+");
        $(subMenu).slideUp(50);
      } else {
        this.dropDownMenuHoverToParentItem(item);
      }
    }
  };

  // SELECTION FUNCTIONS
  ComboTree.prototype.selectMultipleItem = function (ctItem) {
    if (
      this.options.selectableLastNode &&
      $(ctItem).parent("li").hasClass("ComboTreeItemParent")
    ) {
      this.toggleSelectionTree($(ctItem).parent("li"));

      return false;
    }

    if ($(ctItem).data("selectable") == true) {
      this._selectedItem = {
        id: $(ctItem).attr("data-id"),
        title: $(ctItem).text(),
      };

      let check = this.isItemInArray(this._selectedItem, this.options.source);
      if (check) {
        var index = this.isItemInArray(this._selectedItem, this._selectedItems);
        if (index) {
          this._selectedItems.splice(parseInt(index), 1);
          $(ctItem).find("input").prop("checked", false);
        } else {
          this._selectedItems.push(this._selectedItem);
          $(ctItem).find("input").prop("checked", true);
        }
      } // if check
    } // if selectable
  };

  ComboTree.prototype.singleItemClick = function (ctItem) {
    if ($(ctItem).data("selectable") == true) {
      this._selectedItem = {
        id: $(ctItem).attr("data-id"),
        title: $(ctItem).text(),
      };
    } // if selectable

    this.refreshInputVal();
    this.closeDropDownMenu();
  };

  ComboTree.prototype.multiItemClick = function (ctItem) {
    this.selectMultipleItem(ctItem);

    if (this.options.cascadeSelect) {
      if ($(ctItem).parent("li").hasClass("ComboTreeItemParent")) {
        var subMenu = $(ctItem)
          .parent("li")
          .children("ul")
          .first()
          .find('input[type="checkbox"]');
        subMenu.each(function () {
          var $input = $(this);
          if (
            $(ctItem)
              .children('input[type="checkbox"]')
              .first()
              .prop("checked") !== $input.prop("checked")
          ) {
            $input.prop(
              "checked",
              !$(ctItem)
                .children('input[type="checkbox"]')
                .first()
                .prop("checked")
            );
            $input.trigger("click");
          }
        });
      }
    }
    this.refreshInputVal();
  };

  // recursive search for item in arr
  ComboTree.prototype.isItemInArray = function (item, arr) {
    for (var i = 0; i < arr.length; i++) {
      if (item.id == arr[i].id && item.title == arr[i].title) return i + "";

      if (arr[i].hasOwnProperty("subs")) {
        let found = this.isItemInArray(item, arr[i].subs);
        if (found) return found;
      }
    }
    return false;
  };

  ComboTree.prototype.refreshInputVal = function () {
    var tmpTitle = "";

    if (this.options.isMultiple) {
      for (var i = 0; i < this._selectedItems.length; i++) {
        tmpTitle += this._selectedItems[i].title;
        if (i < this._selectedItems.length - 1) tmpTitle += ", ";
      }
    } else {
      tmpTitle = this._selectedItem.title;
    }

    this._input.val(tmpTitle);
    this._input.trigger("change");

    if (this.changeHandler) this.changeHandler();
  };

  ComboTree.prototype.dropDownMenuHover = function (itemSpan, withScroll) {
    this._wrapper.find(".comboTreeItemHover").removeClass("comboTreeItemHover");
    $(itemSpan).addClass("comboTreeItemHover");
    this._elemHoveredItem = $(itemSpan);
    if (withScroll) this.dropDownScrollToHoveredItem(this._elemHoveredItem);
  };

  ComboTree.prototype.dropDownScrollToHoveredItem = function (itemSpan) {
    var curScroll = this._sourceUl.scrollTop();
    this._sourceUl.scrollTop(
      curScroll + $(itemSpan).parent().position().top - 80
    );
  };

  ComboTree.prototype.dropDownMenuHoverToParentItem = function (item) {
    var parentSpanItem = $(
      $(item).parents("li.ComboTreeItemParent")[0]
    ).children("span.combo-tree-list-item-title");
    if (parentSpanItem.length) this.dropDownMenuHover(parentSpanItem, true);
    else this.dropDownMenuHover(this._listItemsTitle[0], true);
  };

  ComboTree.prototype.dropDownInputKeyToggleTreeControl = function (direction) {
    var item = this._elemHoveredItem;
    if ($(item).parent("li").hasClass("ComboTreeItemParent"))
      this.toggleSelectionTree($(item).parent("li"), direction);
    else if (direction == -1) this.dropDownMenuHoverToParentItem(item);
  };

  (ComboTree.prototype.dropDownInputKeyControl = function (step) {
    if (!this._dropDownContainer.is(":visible")) this.toggleDropDown();

    var list = this._listItems.find("span.combo-tree-list-item-title:visible");
    i = this._elemHoveredItem ? list.index(this._elemHoveredItem) + step : 0;
    i = (list.length + i) % list.length;

    this.dropDownMenuHover(list[i], true);
  }),
    (ComboTree.prototype.filterDropDownMenu = function () {
      var searchText = "";
      if (!this.options.isMultiple) searchText = this._input.val();
      else searchText = $("#" + this.id + "MultiFilter").val();

      if (searchText != "") {
        this._listItemsTitle.hide();
        this._listItemsTitle.siblings("span.combo-tree-parent-plus").hide();
        list = this._listItems
          .filter(function (index, item) {
            return (
              item.innerHTML.toLowerCase().indexOf(searchText.toLowerCase()) !=
              -1
            );
          })
          .each(function (i, elem) {
            $(this.children).show();
            $(this).siblings("span.combo-tree-parent-plus").show();
          });
      } else {
        this._listItemsTitle.show();
        this._listItemsTitle.siblings("span.combo-tree-parent-plus").show();
      }
    });

  ComboTree.prototype.processSelected = function () {
    let elements = this._listItemsTitle;
    let selectedItem = this._selectedItem;
    let selectedItems = this._selectedItems;
    this.options.selected.forEach(function (element) {
      let selected = $(elements).filter(function () {
        return $(this).data("id") == element;
      });

      if (selected.length > 0) {
        $(selected).find("input").attr("checked", true);

        selectedItem = {
          id: selected.data("id"),
          title: selected.text(),
        };
        selectedItems.push(selectedItem);
      }
    });

    //Without this it doesn't work
    this._selectedItem = selectedItem;

    this.refreshInputVal();
  };

  // METHODS

  ComboTree.prototype.findItembyId = function (itemId, source) {
    if (itemId && source) {
      for (let i = 0; i < source.length; i++) {
        if (source[i].id == itemId)
          return { id: source[i].id, title: source[i].title };
        if (source[i].hasOwnProperty("subs")) {
          let found = this.findItembyId(itemId, source[i].subs);
          if (found) return found;
        }
      }
    }
    return null;
  };

  // Returns selected id array or null
  ComboTree.prototype.getSelectedIds = function () {
    if (this.options.isMultiple && this._selectedItems.length > 0) {
      var tmpArr = [];
      for (i = 0; i < this._selectedItems.length; i++)
        tmpArr.push(this._selectedItems[i].id);

      return tmpArr;
    } else if (
      !this.options.isMultiple &&
      this._selectedItem.hasOwnProperty("id")
    ) {
      return [this._selectedItem.id];
    }
    return null;
  };

  // Retuns Array (multiple), Integer (single), or False (No choice)
  ComboTree.prototype.getSelectedNames = function () {
    if (this.options.isMultiple && this._selectedItems.length > 0) {
      var tmpArr = [];
      for (i = 0; i < this._selectedItems.length; i++)
        tmpArr.push(this._selectedItems[i].title);

      return tmpArr;
    } else if (
      !this.options.isMultiple &&
      this._selectedItem.hasOwnProperty("id")
    ) {
      return this._selectedItem.title;
    }
    return null;
  };

  ComboTree.prototype.setSource = function (source) {
    this._selectedItems = [];

    this.destroy();
    this.options.source = source;
    this.constructorFunc(this.input, this.options);
  };

  ComboTree.prototype.clearSelection = function () {
    for (i = 0; i < this._selectedItems.length; i++) {
      let itemElemSelector = "#" + this.id + "-li" + this._selectedItems[i].id;
      itemElemSelector = itemElemSelector.replaceAll(".", "\\.");
      let itemElem = $(itemElemSelector);
      $(itemElem).find("input").prop("checked", false);
    }
    this._selectedItems = [];
    this._selectedItem = {};
    if (this._selectAllInput) {
      this._selectAllInput.prop("checked", false);
    }
    this.refreshInputVal();
  };

  ComboTree.prototype.setSelection = function (selectionIdList) {
    if (
      selectionIdList &&
      selectionIdList.length &&
      selectionIdList.length > 0
    ) {
      for (let i = 0; i < selectionIdList.length; i++) {
        let selectedItem = this.findItembyId(
          selectionIdList[i],
          this.options.source
        );

        if (selectedItem) {
          let check = this.isItemInArray(selectedItem, this.options.source);
          if (check) {
            var index = this.isItemInArray(selectedItem, this._selectedItems);
            if (!index) {
              let selectedItemElemSelector =
                "#" + this.id + "-li" + selectionIdList[i];
              selectedItemElemSelector = selectedItemElemSelector.replaceAll(
                ".",
                "\\."
              );
              let selectedItemElem = $(selectedItemElemSelector);

              this._selectedItems.push(selectedItem);
              this._selectedItem = selectedItem;
              // If cascadeSelect is true, check all children, otherwise just check this item
              if (this.options.cascadeSelect) {
                $(selectedItemElem).find("input").prop("checked", true);
              } else {
                $(selectedItemElem).find("input:first").prop("checked", true);
              }
            }
          }
        }
      }
    }

    this.refreshInputVal();
  };

  ComboTree.prototype.selectAll = function () {
    // clear
    for (let i = 0; i < this._selectedItems.length; i++) {
      let itemElem = $("#" + this.id + "-li" + this._selectedItems[i].id);
      $(itemElem).find("input").prop("checked", false);
    }
    this._selectedItems = [];
    // select all
    let selected = this._selectedItems;
    $("#" + this.id + "-source-ul-main")
      .find("input[type='checkbox']")
      .each(function (idx, elem) {
        let $itemElem = $(elem).parent("span").first();
        let item = {
          id: $itemElem.data("id"),
          title: $itemElem.text(),
        };
        $(elem).prop("checked", true);
        selected.push(item);
      });
    if (this._selectAllInput) {
      this._selectAllInput.prop("checked", true);
    }
    this.refreshInputVal();
  };

  // EVENTS

  ComboTree.prototype.onChange = function (callBack) {
    if (callBack && typeof callBack === "function")
      this.changeHandler = callBack;
  };

  // -----

  $.fn[comboTreePlugin] = function (options) {
    var ctArr = [];
    this.each(function () {
      if (!$.data(this, "plugin_" + comboTreePlugin)) {
        $.data(this, "plugin_" + comboTreePlugin, new ComboTree(this, options));
        ctArr.push($(this).data()["plugin_" + comboTreePlugin]);
      }
    });

    if (this.length == 1) return ctArr[0];
    else return ctArr;
  };
})(jQuery, window, document);
