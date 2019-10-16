# ComboTree jQuery Plugin v 1.1.1

ComboTree is a jQuery Plugin which is a combobox item with tree structured data list and multi/single selection options and more. It has been developed to manage large amount of choices and multi selection property. 

## New Features:
- MultiLevel selection is added for Multiple Selection mode.

## Features:
- Tree structured data list in combobox dropdown menu
- Multi/Single selection optional
- Cascade selection
- It returns selection(s) data as Title/Id array
- Filtering
- JSON Data source
- Key Controls
 
## Dependencies:
- jQuery
- icontains.js (filtering. It can be found in repository)
 
## Configurations:
- isMultiple: {True/False} | decide if it is multiple selection behaviour or single
- cascadeSelect: {True/False} | decide if parent selection should cascade to children in multiple selection
- source: {JSON Data Array} | takes source of combobox dropdown menu as a JSON array.
- selected: {JSON Data Array} | takes the list of ID's that corespond from the source.

## Usage

There should be an input element to apply and a JSON Data source.

	comboTree1 = $('#justAnInputBox').comboTree({
		source : SampleJSONData,
		isMultiple: true,
		cascadeSelect: true,
		selected: ['0']
	});

	// Array, One title/id, or False value return
	var selectedTitles = comboTree1.getSelectedItemsTitle();
	var selectedIds = comboTree1.getSelectedItemsId();
	
	// To remove plugin
	comboTree1.destroy();
	


## Sample JSON DATA

Three parameter are needed: id, title and subs.

	var SampleJSONData = [
	{
	    id: 0,
	    title: 'choice 1  '
	}, {
	    id: 1,
	    title: 'choice 2',
	    subs: [
	        {
	            id: 10,
	            title: 'choice 2 1'
	        }, {
	            id: 11,
	            title: 'choice 2 2'
	        }, {
	            id: 12,
	            title: 'choice 2 3'
	        }
	    ]
	}, {
	    id: 2,
	    title: 'choice 3'
	}, {
	    id: 3,
	    title: 'choice 4'
	}, {
	    id: 4,
	    title: 'choice 5'
	}, {
	    id: 5,
	    title: 'choice 6',
	    subs: [
	        {
	            id: 50,
	            title: 'choice 6 1'
	        }, {
	            id: 51,
	            title: 'choice 6 2',
	            subs: [
	                {
	                    id: 510,
	                    title: 'choice 6 2 1'
	                }, {
	                    id: 511,
	                    title: 'choice 6 2 2'
	                }, {
	                    id: 512,
	                    title: 'choice 6 2 3'
	                }
	            ]
	        }
	    ]
	}, {
	    id: 6,
	    title: 'choice 7'
	}
	];


## User Friendly

Key controls, well designed and esasy-read code structure, definitions and clear variable names are choosen to be read and used as much as comfortable I could.


## You can donate to support me

https://www.blockchain.com/btc/address/15c5AxBVgNxkwaHSTBZMiCV5PL41DKe88v