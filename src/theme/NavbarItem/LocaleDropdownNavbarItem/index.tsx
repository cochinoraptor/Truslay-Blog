/**
 * Locale switch.
 *
 * Visual source of truth: the Landing's `src/components/LangSwitch.tsx`
 * (segmented pill, 10–11px uppercase labels, cyan fill on the active locale).
 * Behaviour: Docusaurus' own alternate-page URL builder, so switching language
 * keeps the reader on the same page under the other locale prefix.
 */
import React from 'react';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useAlternatePageUtils} from '@docusaurus/theme-common/internal';
import {translate} from '@docusaurus/Translate';

type Props = {
  mobile?: boolean;
  className?: string;
};

// Same short labels as the Landing's LANGS list.
const LABELS: Record<string, string> = {
  en: 'EN',
  es: 'ES',
  fr: 'FR',
};

export default function LocaleDropdownNavbarItem({
  mobile,
  className,
}: Props): React.ReactElement {
  const {
    i18n: {currentLocale, locales, localeConfigs},
  } = useDocusaurusContext();
  const {search, hash} = useLocation();
  const alternatePageUtils = useAlternatePageUtils();

  const classes = ['truslay-lang', mobile ? 'truslay-lang--mobile' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="group"
      aria-label={translate({
        message: 'Language',
        id: 'theme.navbar.localeSwitch.ariaLabel',
        description: 'Accessible name of the EN / ES / FR language switch',
      })}
      className={classes}>
      {locales.map((locale) => {
        const active = locale === currentLocale;
        const config = localeConfigs[locale];
        return (
          <a
            key={locale}
            href={`${alternatePageUtils.createUrl({
              locale,
              fullyQualified: false,
            })}${search}${hash}`}
            title={config?.label ?? locale}
            lang={config?.htmlLang ?? locale}
            aria-current={active ? 'true' : undefined}
            className="truslay-lang__option">
            {LABELS[locale] ?? locale.toUpperCase()}
          </a>
        );
      })}
    </div>
  );
}
