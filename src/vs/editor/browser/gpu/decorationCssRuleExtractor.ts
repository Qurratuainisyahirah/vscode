/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { $, getActiveDocument } from '../../../base/browser/dom.js';
import { Disposable, toDisposable } from '../../../base/common/lifecycle.js';
import './media/decorationCssRuleExtractor.css';

/**
 * Extracts CSS rules that would be applied to certain decoration classes.
 */
export class DecorationCssRuleExtractor extends Disposable {
	private _container: HTMLElement;
	private _dummyElement: HTMLSpanElement;

	private _ruleCache: Map</* className */string, CSSStyleRule[]> = new Map();

	constructor() {
		super();

		this._container = $('div.monaco-decoration-css-rule-extractor');
		this._dummyElement = $('span');
		this._container.appendChild(this._dummyElement);

		this._register(toDisposable(() => this._container.remove()));
	}

	getStyleRules(canvas: HTMLElement, decorationClassName: string): CSSStyleRule[] {
		// Check cache
		const existing = this._ruleCache.get(decorationClassName);
		if (existing) {
			return existing;
		}

		// Set up DOM
		this._dummyElement.classList.add(decorationClassName);
		canvas.appendChild(this._container);

		// Get rules
		const rules = this._getStyleRules(decorationClassName);
		this._ruleCache.set(decorationClassName, rules);

		// Tear down DOM
		canvas.removeChild(this._container);
		this._dummyElement.classList.remove(decorationClassName);

		return rules;
	}

	private _getStyleRules(className: string) {
		// Iterate through all stylesheets and imported stylesheets to find matching rules
		const rules = [];
		const doc = getActiveDocument();
		const stylesheets = [...doc.styleSheets];
		for (let i = 0; i < stylesheets.length; i++) {
			const stylesheet = stylesheets[i];
			for (const rule of stylesheet.cssRules) {
				if (rule instanceof CSSImportRule) {
					if (rule.styleSheet) {
						stylesheets.push(rule.styleSheet);
					}
				} else if (rule instanceof CSSStyleRule) {
					if (this._dummyElement.matches(rule.selectorText) && rule.selectorText.includes(`.${className}`)) {
						rules.push(rule);
					}
				}
			}
		}

		return rules;
	}
}
