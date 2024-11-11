/**
 * SyntaxHighlighter
 * http://alexgorbatchev.com/SyntaxHighlighter
 *
 * SyntaxHighlighter is donationware. If you are using it, please donate.
 * http://alexgorbatchev.com/SyntaxHighlighter/donate.html
 *
 * @version
 * 3.0.83 (July 02 2010)
 * 
 * @copyright
 * Copyright (C) 2004-2010 Alex Gorbatchev.
 *
 * @license
 * Dual licensed under the MIT and GPL licenses.
 */
;(function()
{
	// CommonJS
	typeof(require) != 'undefined' ? SyntaxHighlighter = require('shCore').SyntaxHighlighter : null;

	function Brush()
	{
		var keywords =	'arp assoc at attrib aux bcdedit break cacls call cd chcp chdir chkdsk chkntfs choice cipher clip cls cmd cmdextversion color com com1 com2 com3 com4 comp compact con convert copy ctty date defined del dir diskcomp diskcopy diskpart do doskey dpath driverquery echo else endlocal equ erase errorlevel exist exit expand fc find findstr for forfiles format fsutil ftype geq	goto gpresult graftabl gtr help icacls if in ipconfig label leq lpt lpt1 lpt2 lpt3 lpt4 lss makecab md mkdir mklink mode more move neq net netsh not nul openfiles path pause ping popd print prompt pushd rd recover reg rem ren rename replace rmdir robocopy rundll32 sc schtasks set setlocal setx shift shutdown sort start subst systeminfo taskkill tasklist time timeout title tree type ver verify vol wmic xcopy';
		var keywordsUpper =  'ARP ASSOC AT ATTRIB AUX BCDEDIT BREAK CACLS CALL CD CHCP CHDIR CHKDSK CHKNTFS CHOICE CIPHER CLIP CLS CMD CMDEXTVERSION COLOR COM COM1 COM2 COM3 COM4 COMP COMPACT CON CONVERT COPY CTTY DATE DEFINED DEL DIR DISKCOMP DISKCOPY DISKPART DO DOSKEY DPATH DRIVERQUERY ECHO ELSE ENDLOCAL EQU ERASE ERRORLEVEL EXIST EXIT EXPAND FC FIND FINDSTR FOR FORFILES FORMAT FSUTIL FTYPE GEQ GOTO GPRESULT GRAFTABL GTR HELP ICACLS IF IN IPCONFIG LABEL LEQ LPT LPT1 LPT2 LPT3 LPT4 LSS MAKECAB MD MKDIR MKLINK MODE MORE MOVE NEQ NET NETSH NOT NUL OPENFILES PATH PAUSE PING POPD PRINT PROMPT PUSHD RD RECOVER REG REM REN RENAME REPLACE RMDIR ROBOCOPY RUNDLL32 SC SCHTASKS SET SETLOCAL SETX SHIFT SHUTDOWN SORT START SUBST SYSTEMINFO TASKKILL TASKLIST TIME TIMEOUT TITLE TREE TYPE VER VERIFY VOL WMIC XCOPY';

		this.regexList = [
			{ regex: /\/[\w-\/]+/gm,										css: 'plain' },
			{ regex: /\sREM.*$/gmi,											css: 'comments' },		// one line comments
			{ regex: SyntaxHighlighter.regexLib.doubleQuotedString,			css: 'string' },		// double quoted strings
			{ regex: SyntaxHighlighter.regexLib.singleQuotedString,			css: 'string' },		// single quoted strings
			{ regex: new RegExp(this.getKeywords(keywords), 'gm'),			css: 'keyword' },		// keywords
			{ regex: new RegExp(this.getKeywords(keywordsUpper), 'gm'),		css: 'keyword' }		// keywords
			];
	}

	Brush.prototype	= new SyntaxHighlighter.Highlighter();
	Brush.aliases	= ['batch'];

	SyntaxHighlighter.brushes.Batch = Brush;

	// CommonJS
	typeof(exports) != 'undefined' ? exports.Brush = Brush : null;
})();
