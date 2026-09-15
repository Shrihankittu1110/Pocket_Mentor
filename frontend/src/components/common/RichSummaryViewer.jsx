import React, { useState, useMemo, useRef } from 'react';
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Download,
  Search,
  Maximize2,
  Minimize2,
  CheckSquare,
  Square,
  Volume2,
  Layers,
  ChevronRight,
  Flame,
  AlertTriangle,
  Lightbulb,
  FileText,
  ListOrdered,
  Tag,
  RotateCw,
  HelpCircle,
  Cpu,
  Target,
  Scale,
  MoreHorizontal
} from 'lucide-react';
import { VoiceControls } from './VoiceControls';

export const RichSummaryViewer = ({
  summaryText = '',
  topic = 'Study Topic',
  voiceProps = {},
  onRegenerate,
  regenerating = false,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fontSize, setFontSize] = useState('normal'); // 'normal' | 'large'
  const [checkedItems, setCheckedItems] = useState({});
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const containerRef = useRef(null);

  // Compute Reading Stats
  const stats = useMemo(() => {
    if (!summaryText) return { words: 0, readTimeMinutes: 1, sectionCount: 0 };
    const words = summaryText.trim().split(/\s+/).filter(Boolean).length;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 180));
    const sectionCount = (summaryText.match(/^##\s+/gm) || []).length || 1;
    return { words, readTimeMinutes, sectionCount };
  }, [summaryText]);

  // Parse Markdown into structured sections
  const parsedSections = useMemo(() => {
    if (!summaryText) return [];

    const lines = summaryText.split('\n');
    const sections = [];
    let currentSection = {
      title: 'Overview',
      icon: '🌟',
      rawTitle: 'Overview',
      level: 2,
      contentLines: [],
    };

    const getIconForTitle = (title) => {
      const lower = title.toLowerCase();
      if (lower.includes('overview') || lower.includes('chapter') || lower.includes('unit')) return '🌟';
      if (lower.includes('anomaly') || lower.includes('pitfall') || lower.includes('fault') || lower.includes('deadlock') || lower.includes('issue')) return '⚠️';
      if (lower.includes('neuron') || lower.includes('perceptron') || lower.includes('model') || lower.includes('brain')) return '🧠';
      if (lower.includes('propagation') || lower.includes('mechanism') || lower.includes('process') || lower.includes('work') || lower.includes('algorithm') || lower.includes('procedure')) return '🔬';
      if (lower.includes('activation') || lower.includes('function') || lower.includes('math') || lower.includes('formula') || lower.includes('equation')) return '📐';
      if (lower.includes('comparison') || lower.includes('versus') || lower.includes('tradeoff')) return '⚖️';
      if (lower.includes('architecture') || lower.includes('structure') || lower.includes('component') || lower.includes('system')) return '🏛️';
      if (lower.includes('loss') || lower.includes('optimizer') || lower.includes('gradient')) return '⚡';
      if (lower.includes('regularization') || lower.includes('normalization') || lower.includes('tlb') || lower.includes('memory')) return '🧱';
      if (lower.includes('exam') || lower.includes('focus') || lower.includes('pitfall')) return '🎯';
      return '📘';
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match ## Section
      const h2Match = line.match(/^##\s+(.*)$/);
      const h1Match = line.match(/^#\s+(.*)$/);

      if (h2Match) {
        if (currentSection.contentLines.length > 0 || currentSection.title !== 'Overview') {
          sections.push(currentSection);
        }
        const rawTitle = h2Match[1].replace(/^[^\w\s]+/, '').trim();
        currentSection = {
          title: rawTitle,
          rawTitle,
          icon: getIconForTitle(rawTitle),
          level: 2,
          contentLines: [],
        };
      } else if (h1Match && sections.length === 0 && currentSection.contentLines.length === 0) {
        // Main Title Header
        currentSection.mainTitle = h1Match[1];
      } else {
        currentSection.contentLines.push(line);
      }
    }

    if (currentSection.contentLines.length > 0 || currentSection.title) {
      sections.push(currentSection);
    }

    return sections;
  }, [summaryText]);

  // Handle Checklist Toggle
  const toggleChecklist = (key) => {
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Copy Full Summary Text
  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Summary as Markdown file
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([summaryText], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_study_guide.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Helper to highlight search term & format bold text
  const formatTextWithHighlights = (text) => {
    if (!text) return null;

    // Helper to render bold terms with highlight badges
    const renderBoldAndText = (str) => {
      const parts = str.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldContent = part.slice(2, -2);
          return (
            <strong
              key={pIdx}
              className="font-extrabold text-slate-900 bg-amber-100/70 text-slate-950 px-1.5 py-0.5 rounded border border-amber-200"
            >
              {highlightSearch(boldContent)}
            </strong>
          );
        }
        return <span key={pIdx}>{highlightSearch(part)}</span>;
      });
    };

    const highlightSearch = (str) => {
      if (!searchTerm.trim()) return str;
      const regex = new RegExp(`(${searchTerm.trim()})`, 'gi');
      const segments = str.split(regex);
      return segments.map((seg, sIdx) =>
        regex.test(seg) ? (
          <mark key={sIdx} className="bg-yellow-300 text-slate-950 font-bold px-1 rounded">
            {seg}
          </mark>
        ) : (
          seg
        )
      );
    };

    return renderBoldAndText(text);
  };

  // Render Section Content Blocks with Markdown Table & Code Support
  const renderContentLines = (lines, sectionIdx) => {
    const rendered = [];
    let listBuffer = [];
    let inList = false;

    const flushList = (keyPrefix) => {
      if (listBuffer.length > 0) {
        rendered.push(
          <ul key={`${keyPrefix}-list`} className="space-y-2.5 my-3 pl-1">
            {listBuffer.map((item, lIdx) => (
              <li key={lIdx} className="flex items-start gap-3 text-slate-800 leading-relaxed text-xs sm:text-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-2"></span>
                <div className="flex-1 font-normal">{formatTextWithHighlights(item)}</div>
              </li>
            ))}
          </ul>
        );
        listBuffer = [];
        inList = false;
      }
    };

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const trimmed = line.trim();

      // Detect and parse Markdown Tables
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList(`table-${lineIdx}`);
        const tableLines = [];
        let tIdx = lineIdx;
        while (tIdx < lines.length && lines[tIdx].trim().startsWith('|') && lines[tIdx].trim().endsWith('|')) {
          tableLines.push(lines[tIdx].trim());
          tIdx++;
        }
        lineIdx = tIdx - 1;

        if (tableLines.length >= 2) {
          const headers = tableLines[0].split('|').map(s => s.trim()).filter(Boolean);
          const rows = tableLines.slice(2).map(r => r.split('|').map(s => s.trim()).filter(Boolean));

          rendered.push(
            <div key={`tbl-${lineIdx}`} className="overflow-x-auto my-4 rounded-2xl border-2 border-indigo-100 shadow-sm bg-white">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-indigo-50/80 text-indigo-950 font-black border-b border-indigo-100">
                  <tr>
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="p-3 border-r border-indigo-100 last:border-r-0">
                        {formatTextWithHighlights(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3 text-slate-700 border-r border-slate-100 last:border-r-0 font-medium">
                          {formatTextWithHighlights(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Sub-headings with teaching badges
      if (trimmed.startsWith('### ')) {
        flushList(`h3-${lineIdx}`);
        const subTitle = trimmed.replace(/^###\s+/, '');
        const lower = subTitle.toLowerCase();

        let subBadge = { icon: '📌', color: 'bg-indigo-50 border-indigo-200 text-indigo-900', label: null };
        if (lower.includes('what is it') || lower.includes('what is an') || lower.includes('definition')) {
          subBadge = { icon: '💡', color: 'bg-blue-50 border-blue-200 text-blue-900', label: 'Core Concept & Definition' };
        } else if (lower.includes('why does it occur') || lower.includes('why occurs') || lower.includes('cause') || lower.includes('reason')) {
          subBadge = { icon: '⚠️', color: 'bg-amber-50 border-amber-200 text-amber-900', label: 'Why It Occurs / Root Cause' };
        } else if (lower.includes('why is it needed') || lower.includes('why needed') || lower.includes('motivation')) {
          subBadge = { icon: '❓', color: 'bg-amber-50 border-amber-200 text-amber-900', label: 'Why It Matters / Motivation' };
        } else if (lower.includes('how does it work') || lower.includes('how it works') || lower.includes('mechanism')) {
          subBadge = { icon: '⚙️', color: 'bg-purple-50 border-purple-200 text-purple-900', label: 'Step-by-Step Mechanism' };
        } else if (lower.includes('step-by-step') || lower.includes('procedure') || lower.includes('steps') || lower.includes('workflow')) {
          subBadge = { icon: '🔢', color: 'bg-indigo-50 border-indigo-200 text-indigo-900', label: 'Execution Procedure' };
        } else if (lower.includes('resolution') || lower.includes('prevention') || lower.includes('solution') || lower.includes('fix')) {
          subBadge = { icon: '🛡️', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', label: 'Resolution & Prevention' };
        } else if (lower.includes('meaning of variables') || lower.includes('variables') || lower.includes('symbols')) {
          subBadge = { icon: '🔤', color: 'bg-sky-50 border-sky-200 text-sky-900', label: 'Variable & Symbol Definitions' };
        } else if (lower.includes('subtopic') || lower.includes('type') || lower.includes('variant')) {
          subBadge = { icon: '🌳', color: 'bg-teal-50 border-teal-200 text-teal-900', label: 'Types & Subtopic Breakdown' };
        } else if (lower.includes('formula') || lower.includes('mathematical') || lower.includes('equation')) {
          subBadge = { icon: '📐', color: 'bg-sky-50 border-sky-200 text-sky-900', label: 'Mathematical Formulation' };
        } else if (lower.includes('example') || lower.includes('walkthrough') || lower.includes('numerical') || lower.includes('case')) {
          subBadge = { icon: '💻', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', label: 'Concrete Walkthrough / Example' };
        } else if (lower.includes('comparison') || lower.includes('tradeoff') || lower.includes('differences')) {
          subBadge = { icon: '⚖️', color: 'bg-cyan-50 border-cyan-200 text-cyan-900', label: 'Comparison & Tradeoffs' };
        } else if (lower.includes('architecture') || lower.includes('component') || lower.includes('structure')) {
          subBadge = { icon: '🏛️', color: 'bg-violet-50 border-violet-200 text-violet-900', label: 'Architecture & System Structure' };
        } else if (lower.includes('complexity') || lower.includes('performance') || lower.includes('analysis')) {
          subBadge = { icon: '⏱️', color: 'bg-orange-50 border-orange-200 text-orange-900', label: 'Complexity & Performance' };
        } else if (lower.includes('detailed explanation') || lower.includes('explanation') || lower.includes('core idea')) {
          subBadge = { icon: '📖', color: 'bg-blue-50 border-blue-200 text-blue-900', label: 'In-Depth Explanation' };
        } else if (lower.includes('key point') || lower.includes('takeaway') || lower.includes('principle')) {
          subBadge = { icon: '📌', color: 'bg-indigo-50 border-indigo-200 text-indigo-900', label: 'Key Principles & Takeaways' };
        } else if (lower.includes('exam focus') || lower.includes('exam') || lower.includes('must-know')) {
          subBadge = { icon: '🎯', color: 'bg-rose-50 border-rose-200 text-rose-900', label: 'High-Yield Exam Focus' };
        }

        rendered.push(
          <div key={`h3-${lineIdx}`} className="mt-6 mb-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-black uppercase tracking-wider shadow-sm ${subBadge.color}`}>
                <span>{subBadge.icon}</span>
                <span>{subTitle}</span>
              </span>
              {subBadge.label && (
                <span className="text-[11px] font-bold text-slate-400">
                  • {subBadge.label}
                </span>
              )}
            </div>
          </div>
        );
        continue;
      }

      // Formula / Math Code Block (`` expression `` or lines with mathematical symbols)
      if (trimmed.startsWith('```') || (trimmed.startsWith('`') && trimmed.endsWith('`') && trimmed.length > 5)) {
        flushList(`code-${lineIdx}`);
        const codeText = trimmed.replace(/^```[a-z]*|```$/g, '').replace(/^`|`$/g, '');
        rendered.push(
          <div key={`code-${lineIdx}`} className="p-4 my-3 rounded-2xl bg-slate-900 text-amber-300 font-mono text-xs sm:text-sm border border-slate-800 shadow-md overflow-x-auto">
            <div className="text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Mathematical Formulation / Logic:</div>
            {formatTextWithHighlights(codeText)}
          </div>
        );
        continue;
      }

      // Checkbox checklist (- [ ] or - [x])
      if (/^[-*]\s+\[([ xX])\]\s+(.*)$/.test(trimmed)) {
        flushList(`check-${lineIdx}`);
        const checkMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
        const checkKey = `sec-${sectionIdx}-item-${lineIdx}`;
        const isChecked = checkedItems[checkKey] ?? checkMatch[1].toLowerCase() === 'x';

        rendered.push(
          <div
            key={checkKey}
            onClick={() => toggleChecklist(checkKey)}
            className={`p-3.5 rounded-2xl border-2 transition flex items-start gap-3 cursor-pointer select-none my-2 ${
              isChecked
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-sm'
                : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700 shadow-sm'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isChecked ? (
                <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-100" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
            </div>
            <div className={`text-xs sm:text-sm font-medium leading-relaxed ${isChecked ? 'line-through text-slate-500' : ''}`}>
              {formatTextWithHighlights(checkMatch[2])}
            </div>
          </div>
        );
        continue;
      }

      // Callout alert box (> ⚠️ or 💡 or 📌 or 🎯)
      if (trimmed.startsWith('>') || /^[⚠️💡📌🔑✅🎯❓]\s+/.test(trimmed)) {
        flushList(`alert-${lineIdx}`);
        const cleanAlert = trimmed.replace(/^>\s*/, '');
        rendered.push(
          <div
            key={`alert-${lineIdx}`}
            className="p-4 my-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/40 border-2 border-amber-200/90 text-amber-950 text-xs sm:text-sm font-medium leading-relaxed flex items-start gap-3 shadow-sm"
          >
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">{formatTextWithHighlights(cleanAlert)}</div>
          </div>
        );
        continue;
      }

      // Numbered Step (1. **Step Name**: description)
      if (/^\d+\.\s+/.test(trimmed)) {
        flushList(`num-${lineIdx}`);
        const stepNum = trimmed.match(/^(\d+)\.\s+/)[1];
        const stepContent = trimmed.replace(/^\d+\.\s+/, '');

        rendered.push(
          <div
            key={`step-${lineIdx}`}
            className="p-4 my-2.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-3.5 shadow-sm"
          >
            <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
              {stepNum}
            </div>
            <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium pt-0.5 flex-1">
              {formatTextWithHighlights(stepContent)}
            </div>
          </div>
        );
        continue;
      }

      // Standard Bullet Point (- or *)
      if (/^[-*•]\s+/.test(trimmed)) {
        const itemText = trimmed.replace(/^[-*•]\s+/, '');
        listBuffer.push(itemText);
        inList = true;
        continue;
      }

      // Standard Paragraph
      if (trimmed.length > 0) {
        flushList(`p-${lineIdx}`);
        rendered.push(
          <p key={`p-${lineIdx}`} className="text-slate-800 leading-relaxed text-xs sm:text-sm my-2.5 font-normal">
            {formatTextWithHighlights(trimmed)}
          </p>
        );
      }
    }

    flushList('end');
    return rendered;
  };

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-3xl border-2 border-slate-200 flex flex-col shadow-2xl transition-all duration-300 ${
        isFullScreen ? 'fixed inset-4 z-50 max-h-none' : 'w-full max-h-[88vh]'
      }`}
    >
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-white rounded-t-3xl">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Deep Mastery Study Guide</span>
            </span>
            <span className="text-[11px] font-bold text-slate-500">
              📖 {stats.readTimeMinutes} min deep read • {stats.words.toLocaleString()} words
            </span>
          </div>

          <h2 className="font-fun text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            {topic}
          </h2>
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Search within guide */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium w-full sm:w-40 md:focus:w-52 transition-all focus:outline-none focus:border-indigo-400 shadow-sm"
            />
          </div>

          {/* Font Size Toggle (Visible on both) */}
          <button
            onClick={() => setFontSize(prev => prev === 'normal' ? 'large' : 'normal')}
            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm shrink-0 min-h-[36px]"
            title="Toggle Text Size"
          >
            {fontSize === 'normal' ? 'Aa+' : 'Aa-'}
          </button>

          {/* Desktop Toolbar (Hidden on mobile < sm) */}
          <div className="hidden sm:flex items-center gap-1.5">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={regenerating}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 min-h-[36px]"
                title="Regenerate Deep Study Guide with AI"
              >
                <RotateCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                <span>{regenerating ? 'Teaching...' : 'Regenerate'}</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm min-h-[36px]"
              title="Copy full study guide to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition shadow-sm min-h-[36px]"
              title="Download Study Notes (.md)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition shadow-sm min-h-[36px]"
              title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Reading Mode"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile 3-Dots Menu Button */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition shadow-sm min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl border-2 border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                {onRegenerate && (
                  <button
                    onClick={() => { setMobileMenuOpen(false); onRegenerate(); }}
                    disabled={regenerating}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                    <span>{regenerating ? 'Teaching...' : 'Regenerate'}</span>
                  </button>
                )}
                <button
                  onClick={() => { setMobileMenuOpen(false); handleCopy(); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Guide'}</span>
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleDownload(); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download .md</span>
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); setIsFullScreen(!isFullScreen); }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                </button>
              </div>
            )}
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition shadow-sm shrink-0 min-h-[36px]"
            >
              Done
            </button>
          )}
        </div>
      </div>

      {/* Voice Controls Toolbar Banner */}
      {summaryText && voiceProps.onSpeak && (
        <div className="px-4 sm:px-6 py-2.5 bg-indigo-50/50 border-b border-indigo-100/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
            <Volume2 className="w-4 h-4 text-indigo-600 animate-pulse shrink-0" />
            <span className="truncate">Smart Audio Tutor: Listen while studying</span>
          </div>

          <div className="w-full sm:w-auto flex justify-end">
            <VoiceControls
              isSpeaking={voiceProps.isSpeaking}
              isPaused={voiceProps.isPaused}
              onSpeak={voiceProps.onSpeak}
              onPause={voiceProps.onPause}
              onResume={voiceProps.onResume}
              onStop={voiceProps.onStop}
              onRepeat={voiceProps.onRepeat}
              label="Listen"
              compact={true}
            />
          </div>
        </div>
      )}

      {/* Quick Table of Contents / Section Navigation */}
      {parsedSections.length > 1 && (
        <>
          {/* Mobile Select Dropdown (< sm) */}
          <div className="sm:hidden px-4 py-2.5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <span className="text-[11px] font-black uppercase text-slate-400 shrink-0">Jump:</span>
            <select
              value={activeSectionIdx}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setActiveSectionIdx(idx);
                const el = document.getElementById(`study-sec-${idx}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 shadow-sm"
            >
              {parsedSections.map((sec, idx) => (
                <option key={idx} value={idx}>
                  {sec.icon} {sec.title}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Horizontal Pills (>= sm) */}
          <div className="hidden sm:flex px-4 sm:px-6 py-2 border-b border-slate-100 items-center gap-2 overflow-x-auto bg-slate-50/50 no-scrollbar">
            <span className="text-[11px] font-black uppercase text-slate-400 shrink-0">Sections:</span>
            {parsedSections.map((sec, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveSectionIdx(idx);
                  const el = document.getElementById(`study-sec-${idx}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                  activeSectionIdx === idx
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{sec.icon}</span>
                <span>{sec.title}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 ${fontSize === 'large' ? 'text-base' : 'text-sm'}`}>
        {parsedSections.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 mx-auto flex items-center justify-center animate-spin">
              <Sparkles className="w-6 h-6" />
            </div>
            <p className="font-fun font-bold text-slate-700">Generating in-depth study summary...</p>
          </div>
        ) : (
          parsedSections.map((sec, secIdx) => (
            <div
              id={`study-sec-${secIdx}`}
              key={secIdx}
              className="bg-white rounded-3xl border-2 border-slate-200/90 p-5 sm:p-7 space-y-3 shadow-sm hover:border-indigo-200 transition"
            >
              {/* Section Header Banner */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-100 border border-indigo-200 flex items-center justify-center text-lg shrink-0 shadow-sm">
                  {sec.icon}
                </div>
                <div>
                  <h3 className="font-fun text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                    {sec.title}
                  </h3>
                </div>
              </div>

              {/* Section Body */}
              <div className="pt-1">
                {renderContentLines(sec.contentLines, secIdx)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-slate-500">
        <div className="flex items-center gap-2">
          <span>🧠 Pocket Mentor Deep Teaching Engine</span>
          <span>•</span>
          <span className="text-indigo-600 font-extrabold">{stats.words.toLocaleString()} words in Study Guide</span>
        </div>

        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Full Guide!' : 'Copy Entire Study Guide'}</span>
        </button>
      </div>
    </div>
  );
};

export default RichSummaryViewer;
