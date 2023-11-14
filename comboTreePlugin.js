/*!
 * jQuery ComboTree Plugin
 * Author:  Erhan FIRAT
 * Mail:    erhanfirat@gmail.com
 * Licensed under the MIT license
 * Version: 1.3.1
 */

(function ($, window, document, undefined) {
  // Default settings
  let comboTreePlugin = "comboTree";
  const defaults = {
    source: [],
    isMultiple: false,
    cascadeSelect: false,
    selected: [],
    collapse: false,
    selectAll: false,
    animationTime: 200,
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
    this.id = "ct-" + Math.floor(Math.random() * 999999);

    this._input.addClass("ct-input-box");
    this._input.wrap(
      '<div id="' + this.id + '-wrapper" class="ct-wrapper"></div>'
    );
    this._input.wrap('<div class="ct-input-wrapper"></div>');
    this._wrapper = $("#" + this.id + "-wrapper");

    this._arrowBtn = $('<button class="ct-arrow-btn" type="button">⯆</button>');
    this._input.after(this._arrowBtn);

    this._wrapper.append('<div class="ct-drop-down-container"></div>');

    // DORP DOWN AREA
    this._dropDownContainer = this._wrapper.find(".ct-drop-down-container");

    this._dropDownContainer.html(this.createSourceHTML());
    this._filterInput = this.options.isMultiple
      ? this._wrapper.find("#" + this.id + "-multi-filter")
      : null;
    this._selectAllInput =
      this.options.isMultiple && this.options.selectAll
        ? this._wrapper.find(".select-all-input")
        : null;
    this._sourceUl = this._wrapper.find(".ct-source-ul-main");

    this._listItems = this._dropDownContainer.find("li");
    this._listItemsTitle = this._dropDownContainer.find(
      "span.ct-list-item-title"
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
    let sourceHTML = "";
    if (this.options.isMultiple)
      sourceHTML += this.createFilterHTMLForMultiSelect();
    // if (this.options.isMultiple && this.options.selectAll)
    //   sourceHTML += this.createSelectAllHTMLForMultiSelect();
    sourceHTML += this.createSourceSubItemsHTML(this.options.source, false);
    return sourceHTML;
  };

  ComboTree.prototype.createFilterHTMLForMultiSelect = function () {
    return (
      '<input id="' +
      this.id +
      '-multi-filter" type="text" class="ct-multiples-filter" placeholder="Type to filter"/>'
    );
  };

  ComboTree.prototype.createSelectAllHTMLForMultiSelect = function () {
    return (
      '<li id="ct-select-all-li"><label class="select-all"><input type="checkbox" id="' +
      this.id +
      '-select-all-input"' +
      'class="select-all-input"' +
      ">[Select All]</label></li>"
    );
  };

  ComboTree.prototype.createSourceSubItemsHTML = function (
    subItems,
    parentId,
    collapse = false
  ) {
    let subItemsHtml =
      '<ul id="' +
      this.id +
      "-source-ul" +
      (parentId ? parentId : "-main") +
      '" class="ct-source-ul-' +
      (parentId ? "parent" : "main") +
      '" style="' +
      ((this.options.collapse || collapse) && parentId ? "display:none;" : "") +
      '">';

    if (parentId === false && this.options.isMultiple && this.options.selectAll)
      subItemsHtml += this.createSelectAllHTMLForMultiSelect();

    for (let i = 0; i < subItems.length; i++) {
      subItemsHtml += this.createSourceItemHTML(subItems[i]);
    }
    subItemsHtml += "</ul>";
    return subItemsHtml;
  };

  ComboTree.prototype.createSourceItemHTML = function (sourceItem) {
    let itemHtml = "";
    const isThereSubs = sourceItem.hasOwnProperty("subs");
    const collapse = sourceItem.hasOwnProperty("collapse")
      ? sourceItem.hasOwnProperty("collapse")
      : false;
    let isSelectable =
      sourceItem.isSelectable === undefined ? true : sourceItem.isSelectable;
    let selectableClass = isSelectable ? "selectable" : "not-selectable";

    itemHtml +=
      '<li id="ct-' +
      this.id +
      "-li-" +
      sourceItem.id +
      '" class="ct-item-' +
      (isThereSubs ? "parent" : "child") +
      '"> ';

    itemHtml += `${
      isThereSubs
        ? `<span class="ct-parent-plus">${
            this.options.collapse || collapse ? "+" : "-"
          }</span>`
        : ""
    }<span
      data-id="${sourceItem.id}"
      data-selectable="${isSelectable}"
      class="ct-list-item-title ${selectableClass}"
    >${
      this.options.isMultiple && isSelectable ? '<input type="checkbox" />' : ""
    }${sourceItem.title}</span>`;

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
    const _this = this;

    $(this._input).focus(function (e) {
      if (!_this._dropDownContainer.is(":visible"))
        $(_this._dropDownContainer).slideToggle(_this.options.animationTime);
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
      if ($(this).hasClass("ct-item-parent")) {
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
    $(this._dropDownContainer).slideToggle(
      this.options.animationTime,
      function () {
        if (_this._dropDownContainer.is(":visible")) $(_this._input).focus();
      }
    );
  };

  ComboTree.prototype.closeDropDownMenu = function () {
    $(this._dropDownContainer).slideUp(this.options.animationTime);
  };

  // Selection Tree Open/Close
  ComboTree.prototype.toggleSelectionTree = function (item, direction) {
    const subMenu = $(item).children("ul")[0];
    if (direction === undefined) {
      if ($(subMenu).is(":visible"))
        $(item).children("span.ct-parent-plus").html("+");
      else $(item).children("span.ct-parent-plus").html("-");

      $(subMenu).slideToggle(this.options.animationTime);
    } else if (direction == 1 && !$(subMenu).is(":visible")) {
      $(item).children("span.ct-parent-plus").html("-");
      $(subMenu).slideDown(this.options.animationTime);
    } else if (direction == -1) {
      if ($(subMenu).is(":visible")) {
        $(item).children("span.ct-parent-plus").html("+");
        $(subMenu).slideUp(this.options.animationTime);
      } else {
        this.dropDownMenuHover(item);
      }
    }
  };

  // SELECTION FUNCTIONS
  ComboTree.prototype.selectMultipleItem = function (ctItem) {
    if (
      $(ctItem).parent("li").hasClass("ct-item-parent") &&
      $(ctItem).data("selectable") == false
    ) {
      this.toggleSelectionTree($(ctItem).parent("li"));
    }

    if ($(ctItem).data("selectable") == true) {
      this._selectedItem = {
        id: $(ctItem).attr("data-id"),
        title: $(ctItem).text(),
      };

      const check = this.isItemInArray(this._selectedItem, this.options.source);
      if (check) {
        const index = this.isItemInArray(
          this._selectedItem,
          this._selectedItems
        );
        if (index) {
          this._selectedItems.splice(parseInt(index), 1);
          $(ctItem).find("input").prop("checked", false);
        } else {
          this._selectedItems.push(this._selectedItem);
          $(ctItem).find("input").prop("checked", true);
        }
      }
    }
  };

  ComboTree.prototype.singleItemClick = function (ctItem) {
    if ($(ctItem).data("selectable") == true) {
      this._selectedItem = {
        id: $(ctItem).attr("data-id"),
        title: $(ctItem).text(),
      };

      this.refreshInputVal();
      this.closeDropDownMenu();
    } else if ($(ctItem).parent("li").hasClass("ct-item-parent")) {
      this.toggleSelectionTree($(ctItem).parent("li"));
    }
  };

  ComboTree.prototype.multiItemClick = function (ctItem) {
    this.selectMultipleItem(ctItem);

    if (this.options.cascadeSelect && $(ctItem).data("selectable")) {
      if ($(ctItem).parent("li").hasClass("ct-item-parent")) {
        const subMenu = $(ctItem)
          .parent("li")
          .children("ul")
          .first()
          .find('input[type="checkbox"]');
        subMenu.each(function () {
          const $input = $(this);
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
    for (let i = 0; i < arr.length; i++) {
      if (item.id == arr[i].id && item.title == arr[i].title) return i + "";

      if (arr[i].hasOwnProperty("subs")) {
        const found = this.isItemInArray(item, arr[i].subs);
        if (found) return found;
      }
    }
    return false;
  };

  ComboTree.prototype.refreshInputVal = function () {
    let tmpTitle = "";

    if (this.options.isMultiple) {
      for (let i = 0; i < this._selectedItems.length; i++) {
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
    this._wrapper.find(".ct-tree-item-hover").removeClass("ct-tree-item-hover");
    $(itemSpan).addClass("ct-tree-item-hover");
    this._elemHoveredItem = $(itemSpan);
    if (withScroll && itemSpan)
      this.dropDownScrollToHoveredItem(this._elemHoveredItem);
  };

  ComboTree.prototype.dropDownScrollToHoveredItem = function (itemSpan) {
    this._sourceUl.parent().scrollTop(itemSpan[0].offsetTop - 30);
  };

  ComboTree.prototype.dropDownInputKeyToggleTreeControl = function (direction) {
    const item = this._elemHoveredItem;
    if ($(item).parent("li").hasClass("ct-item-parent"))
      this.toggleSelectionTree($(item).parent("li"), direction);
    else if (direction == -1) this.dropDownMenuHover(item);
  };

  ComboTree.prototype.dropDownInputKeyControl = function (step) {
    if (!this._dropDownContainer.is(":visible")) this.toggleDropDown();

    const list = this._listItems.find("span.ct-list-item-title:visible");
    let i = this._elemHoveredItem
      ? list.index(this._elemHoveredItem) + step
      : 0;
    i = (list.length + i) % list.length;

    this.dropDownMenuHover(list[i], true);
  };

  ComboTree.prototype.filterDropDownMenu = function () {
    let searchText = "";
    const _this = this;
    if (!this.options.isMultiple) searchText = this._input.val();
    else
      searchText = this._wrapper.find("#" + _this.id + "-multi-filter").val();

    if (searchText != "") {
      this._listItemsTitle.hide();
      this._listItemsTitle.siblings("span.ct-parent-plus").hide();
      list = this._listItems
        .filter(function (index, item) {
          return (
            item.innerHTML.toLowerCase().indexOf(searchText.toLowerCase()) != -1
          );
        })
        .each(function (i, elem) {
          $(this.children).show();
          $(this).siblings("span.ct-parent-plus").show();
        });
    } else {
      this._listItemsTitle.show();
      this._listItemsTitle.siblings("span.ct-parent-plus").show();
    }
  };

  ComboTree.prototype.processSelected = function () {
    const elements = this._listItemsTitle;
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
      const tmpArr = [];
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
      const tmpArr = [];
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
      let itemElemSelector =
        "#ct-" + this.id + "-li-" + this._selectedItems[i].id;
      itemElemSelector = itemElemSelector.replaceAll(".", "\\.");
      let itemElem = this._wrapper.find(itemElemSelector);
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
            const index = this.isItemInArray(selectedItem, this._selectedItems);
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
    const _this = this;
    this._selectedItems = [];
    this._wrapper
      .find("#" + this.id + "-source-ul-main")
      .find("[data-selectable=true] input[type='checkbox']")
      .each(function (idx, inputCheck) {
        let $itemElem = $(inputCheck).parent("span").first();
        let item = {
          id: $itemElem.data("id"),
          title: $itemElem.text(),
        };
        $(inputCheck).prop("checked", true);
        _this._selectedItems.push(item);
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
    const ctArr = [];
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

const comboTreeIcons = {
  downIcon: `<?xml version="1.0" encoding="utf-8"?><svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 10L12 15L17 10" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  plus: `<?xml version="1.0" encoding="utf-8"?><svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12H15" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 9L12 15" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  minus: `<?xml version="1.0" encoding="utf-8"?><svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12H15" stroke="#323232" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};
