# -*- coding: utf-8 -*-
# Handles the main integration (bindings) with Anki
#
# This files is part of fill-the-blanks expanded addon
# @author ricardo saturnino
# -------------------------------------------------------

instance = None

import os

from anki import hooks
from anki.hooks import wrap, addHook
from anki.utils import strip_html
from aqt import gui_hooks
from aqt import mw
from aqt.reviewer import Reviewer
from aqt.utils import tooltip

from .config import ConfigService, ConfigKey
from .handler import addon_field_filter, on_show_question, handle_answer, cleanup_context, AnkiInterface, getTypedAnswer, FieldsContext

CWD = os.path.dirname(os.path.realpath(__file__))

CSS_STYLE = """
<style type="text/css">
input.ftb, select.ftb {    
    border-radius: 5px;
    border: 1px solid;
    min-width: 50px;
    max-width: 400px;
    padding: 3px;    
    margin: 2px;
}
input.ftb-md, select.ftb-md {
    width: 150px;
}
input.st-incomplete, select.st-incomplete {
    background-color: #FFFF77;
    color: #333;
}
input.st-error, select.st-error {
    background-color: #ff9999;
    color: #333;
}
input.st-ok, select.st-ok {
    background-color: #99ff99;
    color: #333;
}
input.st-wrong-rect, select.st-wrong-rect {
    background-color: #fff;
    color: #333;
    border: 2px solid #ff4d4d;
    box-shadow: 0 0 0 3px rgba(255, 77, 77, 0.2);
}

.cloze.st-error {
    color: #ff4949;
    text-decoration: line-through;
    margin-right: 3px;
}
.cloze.st-expected {
    color: orange;
}
.cloze.st-ok {
    color: #3bd03b;
}

.ftb-reveal-popup {
    position: absolute;
    z-index: 9999;
    display: none;
}
.ftb-reveal-popup.ftb-reveal-open {
    display: block;
}
.ftb-reveal-card {
    min-width: 220px;
    max-width: 340px;
    background: #1f1f1f;
    color: #f5f5f5;
    border-radius: 10px;
    padding: 12px 14px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    border: 1px solid rgba(255,255,255,0.08);
}
.ftb-reveal-title {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #c2c2c2;
    margin-bottom: 6px;
}
.ftb-reveal-answer {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
    margin-bottom: 12px;
    word-break: break-word;
}
.ftb-reveal-actions {
    display: flex;
    gap: 10px;
}
.ftb-btn {
    flex: 1;
    border: none;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.05s ease-in-out, box-shadow 0.2s ease-in-out;
}
.ftb-btn:active {
    transform: translateY(1px);
}
.ftb-btn-ok {
    background: #2ecc71;
    color: #0b3a1c;
    box-shadow: 0 6px 16px rgba(46, 204, 113, 0.35);
}
.ftb-btn-wrong {
    background: #ff4d4d;
    color: #3d0b0b;
    box-shadow: 0 6px 16px rgba(255, 77, 77, 0.35);
}

.ftb-idle-hint {
    position: absolute;
    z-index: 9998;
    display: none;
    pointer-events: none;
}
.ftb-idle-hint.ftb-idle-open {
    display: block;
}
.ftb-idle-card {
    background: #1f1f1f;
    color: #f5f5f5;
    border-radius: 10px;
    padding: 10px 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    border: 1px solid rgba(255,255,255,0.08);
    min-width: 160px;
    max-width: 320px;
}
.ftb-idle-title {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #c2c2c2;
    margin-bottom: 6px;
}
.ftb-idle-text {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
    word-break: break-word;
}
.ftb-idle-space {
    display: inline-block;
    min-width: 12px;
    height: 1em;
    background: #2ecc71;
    border-radius: 4px;
    margin: 0 2px;
    vertical-align: middle;
}

</style>
"""

_handler = None
JS_LOCATION = CWD + '/fill-blanks.js'
_warn_template_shown = False

def _ankiConfigRead(key):
    return mw.addonManager.getConfig(__name__)[key]


def warn_template_editor(*args):
    global _warn_template_shown
    if not _warn_template_shown:
        tooltip("[Fill-in-the-blanks] Be aware: The add-on does not apply to the template editor. To check it, please go to Review mode", 9000)
        _warn_template_shown = True


def wrapInitWeb(anki_mw, fn):
    def _initReviewerWeb(*args):
        fn()

        addStylesJs = """
                var prStyle = `{}`;

                $(prStyle).appendTo('body');
                """.format(CSS_STYLE)

        anki_mw.reviewer.web.eval(addStylesJs)

        f = open(JS_LOCATION, 'r')
        anki_mw.reviewer.web.eval("""
                %s
            """ % f.read())

        if not ConfigService.read(ConfigKey.FEEDBACK_ENABLED, bool):
            anki_mw.reviewer.web.eval('disableInstantFb();')

        if ConfigService.read(ConfigKey.IGNORE_CASE, bool):
            anki_mw.reviewer.web.eval('ignoreCaseOnFeedback();')

        if ConfigService.read(ConfigKey.IGNORE_ACCENTS, bool):
            anki_mw.reviewer.web.eval('ignoreAccentsOnFeedback();')

        if ConfigService.read(ConfigKey.ASIAN_CHARS, bool):
            print('Enabling experimental Asian Chars mode')
            anki_mw.reviewer.web.eval('enableAsianChars();')

        if ConfigService.read(ConfigKey.IDLE_HINT_ENABLED, bool):
            anki_mw.reviewer.web.eval('enableIdleHint();')
        else:
            anki_mw.reviewer.web.eval('disableIdleHint();')

        idle_delay = ConfigService.read(ConfigKey.IDLE_HINT_DELAY_MS, int)
        anki_mw.reviewer.web.eval('setIdleHintDelay(%d);' % idle_delay)

    return _initReviewerWeb


def _setup_anki_integration():
    AnkiInterface.staticReviewer = mw.reviewer
    AnkiInterface.strip_HTML = strip_html
    FieldsContext.ignore_case = ConfigService.read(ConfigKey.IGNORE_CASE, bool)

    hooks.field_filter.append(addon_field_filter)
    addHook("showQuestion", on_show_question)

    gui_hooks.card_layout_will_show.append(warn_template_editor)
    gui_hooks.card_will_show.append(handle_answer)
    gui_hooks.reviewer_did_answer_card.append(cleanup_context)

    Reviewer._getTypedAnswer = wrap(Reviewer._getTypedAnswer,
                                    lambda _, _old: getTypedAnswer(_old), "around")


def run():
    # tooltip('Loading fill-the-blanks expanded Handler')
    ConfigService.load_config = _ankiConfigRead

    reviewer = mw.reviewer
    reviewer._initWeb = wrapInitWeb(mw, reviewer._initWeb)

    _setup_anki_integration()
