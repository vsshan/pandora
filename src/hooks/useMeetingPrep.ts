import { useState, useRef, useCallback, useEffect } from 'react';
import { Meeting, companyNews, companyInsights, previousMeetings } from '../data/mockData';

export type PrepDuration = 5 | 10 | 15;

export interface ScriptSection {
  sectionName: string;
  text: string;
}

export interface PrepPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isStarting: boolean;
  currentSectionIndex: number;
  currentSectionName: string;
  elapsed: number;
  total: number;
  sections: ScriptSection[];
}

const DURATION_TOTALS: Record<PrepDuration, number> = { 5: 300, 10: 600, 15: 900 };

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function buildScript(meeting: Meeting, duration: PrepDuration): ScriptSection[] {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const sections: ScriptSection[] = [];

  // Section 1: Meeting details (always included)
  sections.push({
    sectionName: 'Meeting Details',
    text: `Your next meeting is ${meeting.title}, scheduled for ${meeting.date}. Meeting type: ${meeting.typeLabel}. Led by ${meeting.owner}, ${meeting.ownerTitle}.`,
  });

  // Section 2: Action items (always included)
  const recentPast = previousMeetings.filter((m) => {
    if (!m.actionItems?.length) return false;
    const d = new Date(m.date);
    return d >= threeMonthsAgo;
  });
  const allActionItems = recentPast.flatMap((m) => m.actionItems ?? []);
  if (allActionItems.length > 0) {
    sections.push({
      sectionName: 'Action Items',
      text: `You have ${allActionItems.length} outstanding action item${allActionItems.length > 1 ? 's' : ''} from recent meetings. ${allActionItems.map((a, i) => `Item ${i + 1}: ${a}`).join('. ')}.`,
    });
  } else {
    sections.push({
      sectionName: 'Action Items',
      text: 'There are no outstanding action items from recent meetings.',
    });
  }

  // Section 3: Past interactions summary (10 and 15 min only)
  if (duration >= 10) {
    const pastInteractions = previousMeetings.filter((m) => {
      const d = new Date(m.date);
      return d >= threeMonthsAgo;
    });
    if (pastInteractions.length > 0) {
      const summary = pastInteractions
        .map((m) => `${m.title} on ${m.date} with ${m.owner}`)
        .join('; ');
      sections.push({
        sectionName: 'Past Interactions',
        text: `Over the past 3 months you have had ${pastInteractions.length} interaction${pastInteractions.length > 1 ? 's' : ''} with this client. ${summary}.`,
      });
    } else {
      sections.push({
        sectionName: 'Past Interactions',
        text: 'There are no recorded interactions with this client in the past 3 months.',
      });
    }
  }

  // Section 4: News and insights (15 min only)
  if (duration >= 15) {
    const recentNews = companyNews.filter((n) => {
      if (!n.isoDate) return false;
      return new Date(n.isoDate) >= twoWeeksAgo;
    });
    const recentInsights = companyInsights.filter((ins) => {
      if (!ins.isoDate) return false;
      return new Date(ins.isoDate) >= twoWeeksAgo;
    });

    const newsText =
      recentNews.length > 0
        ? `Recent news: ${recentNews.map((n) => `${n.source} reports: ${n.headline}`).join('. ')}.`
        : 'No recent news in the past two weeks.';

    const insightsText =
      recentInsights.length > 0
        ? `Team insights: ${recentInsights.map((ins) => `${ins.author} notes: ${ins.content}`).join('. ')}.`
        : 'No recent team insights in the past two weeks.';

    sections.push({
      sectionName: 'News & Insights',
      text: `${newsText} ${insightsText}`,
    });
  }

  return sections;
}

export function useMeetingPrep(meeting: Meeting | null) {
  const [state, setState] = useState<PrepPlayerState>({
    isPlaying: false,
    isPaused: false,
    isStarting: false,
    currentSectionIndex: 0,
    currentSectionName: '',
    elapsed: 0,
    total: 0,
    sections: [],
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    () => {
      stopTimer();
      timerRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.elapsed + 1 >= prev.total) {
            return { ...prev, elapsed: prev.total, isPlaying: false, isPaused: false };
          }
          return { ...prev, elapsed: prev.elapsed + 1 };
        });
      }, 1000);
    },
    [stopTimer]
  );

  const speakSection = useCallback(
    (sections: ScriptSection[], index: number) => {
      if (index >= sections.length) {
        stopTimer();
        window.speechSynthesis.cancel();
        setState((prev) => ({ ...prev, isPlaying: false, isPaused: false, isStarting: false, sections: [] }));
        return;
      }
      const section = sections[index];
      const utterance = new SpeechSynthesisUtterance(section.text);
      utterance.rate = 0.95;
      utterance.lang = 'en-US';
      utterance.onstart = () => {
        setState((prev) => ({
          ...prev,
          currentSectionIndex: index,
          currentSectionName: section.sectionName,
          isPlaying: true,
          isPaused: false,
          isStarting: false,
        }));
      };
      utterance.onend = () => {
        speakSection(sections, index + 1);
      };
      window.speechSynthesis.speak(utterance);
    },
    [stopTimer]
  );

  const start = useCallback(
    (duration: PrepDuration) => {
      if (!meeting) return;
      window.speechSynthesis.cancel();
      stopTimer();

      const sections = buildScript(meeting, duration);
      const total = DURATION_TOTALS[duration];

      setState({
        isPlaying: false,
        isPaused: false,
        isStarting: true,
        currentSectionIndex: 0,
        currentSectionName: sections[0]?.sectionName ?? '',
        elapsed: 0,
        total,
        sections,
      });

      startTimer();
      speakSection(sections, 0);
    },
    [meeting, stopTimer, startTimer, speakSection]
  );

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    stopTimer();
    setState((prev) => ({ ...prev, isPlaying: false, isPaused: true }));
  }, [stopTimer]);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    startTimer();
    setState((prev) => ({ ...prev, isPlaying: true, isPaused: false }));
  }, [startTimer, state.total]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    stopTimer();
    setState({
      isPlaying: false,
      isPaused: false,
      isStarting: false,
      currentSectionIndex: 0,
      currentSectionName: '',
      elapsed: 0,
      total: 0,
      sections: [],
    });
  }, [stopTimer]);

  useEffect(() => {
    if (state.total > 0 && state.elapsed >= state.total) {
      window.speechSynthesis.cancel();
      stopTimer();
    }
  }, [state.elapsed, state.total, stopTimer]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      stopTimer();
    };
  }, [stopTimer]);

  return { state, start, pause, resume, stop };
}
