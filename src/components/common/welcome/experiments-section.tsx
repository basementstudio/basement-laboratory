import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { FC, useState } from 'react'

import s from './welcome.module.css'

export type ExperimentsSectionProps = {
  experiments: {
    title: string
    href: string
    tags: string[]
    contributors: {
      id: string
      url: string
      name: string
      avatarUrl: string
      email: string
      company: string
    }[]
  }[]
}

const ExperimentsSection: FC<ExperimentsSectionProps> = ({ experiments }) => {
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const filteredExperiments = experiments.filter(({ tags }) => {
    const match =
      tagFilters.length === 0 ||
      tagFilters.every((tag) => {
        return tags.includes(tag)
      })
    return match
  })

  const handleTagClick = (tag: string) => {
    if (tagFilters.includes(tag)) {
      setTagFilters(tagFilters.filter((t) => t !== tag))
    } else {
      setTagFilters([...tagFilters, tag])
    }
  }

  return (
    <>
      <div className={s.experimentsHeader}>
        <h3 className={clsx(s.header, s.noMargin)}>Experiments</h3>
        <div className={s.tags}>
          {tagFilters.map((tag) => (
            <button
              key={tag}
              className={clsx(s.tag, s.activeTag)}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      <div className={clsx(s.box, s.noPadding)}>
        <ol>
          {filteredExperiments.map(
            ({ title, href, tags, contributors }, idx) => (
              <li className={s.boxEntry} key={href}>
                {/* <Link href={href}> */}
                {/* <a> */}
                <div className={s.experimentInner}>
                  <div className={s.info}>
                    <span className={s.leftSign}>{idx + 1}</span>
                    <h4>{title}</h4>
                  </div>
                  <div className={s.tags}>
                    {tags.map((tag) => (
                      <button
                        onClick={() => handleTagClick(tag)}
                        key={tag}
                        className={clsx(s.tag, {
                          [s.activeTag]: tagFilters.includes(tag)
                        })}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className={s.contributors}>
                    {contributors.map((user) => (
                      <span
                        className={s.contributor}
                        key={user.id}
                        title={user.name}
                      >
                        <Link href={user.url}>
                          <Image
                            layout="raw"
                            width={32}
                            height={32}
                            src={user.avatarUrl}
                          />
                        </Link>
                      </span>
                    ))}
                  </div>
                </div>
                {/* </a> */}
                {/* </Link> */}
              </li>
            )
          )}
        </ol>
      </div>
    </>
  )
}

export default ExperimentsSection
