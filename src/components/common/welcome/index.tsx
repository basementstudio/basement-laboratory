import clsx from 'clsx'
import Image from 'next/image'
import Link from 'next/link'
import { FC } from 'react'

import s from './welcome.module.css'

type WelcomeProps = {
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

const links = [
  {
    href: 'https://hofk.de/main/discourse.threejs/',
    label: 'Incredible discourse.threejs examples 🤯'
  },
  {
    href: 'https://webgl-shaders.com/',
    label: 'Amazing WebGL Shaders 🔥'
  },
  {
    href: 'https://gltf.pmnd.rs/',
    label: 'Tool | Three Fiber GLTF scaffoling'
  },
  {
    href: 'https://gltf.report/',
    label: 'Tool | GLTF Report'
  }
]

const Welcome: FC<WelcomeProps> = ({ experiments }) => (
  <div className={s.welcome}>
    <div className={s.container}>
      <div className={s.logo}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 250 250"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M59.4125 135.371C59.4125 125.265 67.6033 117.074 77.7092 117.074H106.703C116.809 117.074 125 125.265 125 135.371V179.308C125 189.414 116.809 197.604 106.703 197.604H77.7092C67.6033 197.604 59.4125 189.414 59.4125 179.308V135.371ZM57.5645 202.569C57.5645 229.105 79.0754 250 105.612 250H134.758C161.703 250 183.549 228.154 183.549 201.209V112.83C183.549 85.8847 161.703 64.0385 134.758 64.0385H98.1649C76.7151 64.0385 59.2844 81.957 59.132 103.401V0H0.58252V248.78H57.5645V202.569Z"
            fill="white"
          />
          <path
            d="M249.418 197.604H198.187V248.835H249.418V197.604Z"
            fill="white"
          />
        </svg>
      </div>

      <div className={s.box}>
        <p>
          👋 Hi there. You are on the basement experimental corner. Here you'll
          find all kinds of 3d visuals, animations, shaders and creative
          development related stuff.
        </p>
        <p>
          Take a look at the examples below and don't forget to leave a ⭐️ on
          the{' '}
          <a href="https://github.com/basementstudio/experiments">
            github repo
          </a>
          .
        </p>
      </div>

      <h3>Useful Links</h3>
      <div className={clsx(s.box, s.noPadding)}>
        <ul>
          {links.map(({ href, label }) => (
            <li className={s.boxEntry} key={href}>
              <Link href={href}>
                <a>
                  <div className={s.linkInner}>
                    <span className={s.leftSign}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.85996 6.19338L6.19329 8.86004C6.13081 8.92202 6.08121 8.99575 6.04737 9.07699C6.01352 9.15823 5.99609 9.24537 5.99609 9.33338C5.99609 9.42138 6.01352 9.50852 6.04737 9.58976C6.08121 9.671 6.13081 9.74473 6.19329 9.80671C6.25527 9.86919 6.329 9.91879 6.41024 9.95264C6.49148 9.98648 6.57862 10.0039 6.66663 10.0039C6.75463 10.0039 6.84177 9.98648 6.92301 9.95264C7.00425 9.91879 7.07798 9.86919 7.13996 9.80671L9.80663 7.14004C9.93216 7.01451 10.0027 6.84424 10.0027 6.66671C10.0027 6.48917 9.93216 6.31891 9.80663 6.19338C9.68109 6.06784 9.51083 5.99731 9.33329 5.99731C9.15576 5.99731 8.98549 6.06784 8.85996 6.19338V6.19338Z"
                          fill="white"
                        />
                        <path
                          d="M8.18571 11.6L7.33238 12.4467C6.85333 12.9403 6.20934 13.2403 5.52324 13.2895C4.83714 13.3387 4.15694 13.1336 3.61238 12.7134C3.32456 12.4762 3.08969 12.1813 2.92294 11.8477C2.75619 11.5141 2.66126 11.1493 2.6443 10.7767C2.62734 10.4041 2.68871 10.0321 2.82446 9.68478C2.9602 9.33742 3.1673 9.02239 3.43238 8.76004L4.37904 7.80671C4.44153 7.74473 4.49113 7.671 4.52497 7.58976C4.55882 7.50852 4.57624 7.42138 4.57624 7.33337C4.57624 7.24537 4.55882 7.15823 4.52497 7.07699C4.49113 6.99575 4.44153 6.92202 4.37904 6.86004C4.31707 6.79756 4.24333 6.74796 4.16209 6.71411C4.08086 6.68027 3.99372 6.66284 3.90571 6.66284C3.8177 6.66284 3.73057 6.68027 3.64933 6.71411C3.56809 6.74796 3.49435 6.79756 3.43238 6.86004L2.58571 7.71337C1.87248 8.40404 1.4341 9.33006 1.35196 10.3195C1.26981 11.3089 1.54948 12.2945 2.13904 13.0934C2.48896 13.5473 2.93147 13.9216 3.43717 14.1914C3.94287 14.4612 4.50018 14.6203 5.0721 14.6581C5.64401 14.6959 6.21743 14.6117 6.75426 14.4108C7.29109 14.21 7.77904 13.8973 8.18571 13.4934L9.13238 12.5467C9.25791 12.4212 9.32844 12.2509 9.32844 12.0734C9.32844 11.8958 9.25791 11.7256 9.13238 11.6C9.00684 11.4745 8.83658 11.404 8.65904 11.404C8.48151 11.404 8.31125 11.4745 8.18571 11.6V11.6Z"
                          fill="white"
                        />
                        <path
                          d="M13.1073 2.14677C12.303 1.55108 11.3093 1.26856 10.3119 1.35199C9.3145 1.43541 8.38155 1.87908 7.68735 2.60011L6.96735 3.33344C6.88505 3.39326 6.81624 3.4697 6.76536 3.55781C6.71448 3.64592 6.68267 3.74372 6.67199 3.8449C6.6613 3.94608 6.67198 4.04838 6.70334 4.14517C6.7347 4.24195 6.78603 4.33108 6.85402 4.40677C6.91599 4.46926 6.98972 4.51885 7.07096 4.5527C7.1522 4.58655 7.23934 4.60397 7.32735 4.60397C7.41536 4.60397 7.50249 4.58655 7.58373 4.5527C7.66497 4.51885 7.73871 4.46926 7.80068 4.40677L8.66735 3.53344C9.14375 3.03765 9.78698 2.736 10.4728 2.68675C11.1586 2.6375 11.8383 2.84414 12.3807 3.26677C12.6706 3.50397 12.9074 3.79961 13.0755 4.13442C13.2435 4.46922 13.3392 4.83568 13.3562 5.20993C13.3731 5.58417 13.3111 5.95778 13.174 6.30644C13.037 6.65509 12.828 6.97095 12.5607 7.23344L11.614 8.18677C11.5515 8.24875 11.5019 8.32248 11.4681 8.40372C11.4342 8.48496 11.4168 8.5721 11.4168 8.66011C11.4168 8.74811 11.4342 8.83525 11.4681 8.91649C11.5019 8.99773 11.5515 9.07146 11.614 9.13344C11.676 9.19593 11.7497 9.24552 11.831 9.27937C11.9122 9.31321 11.9993 9.33064 12.0873 9.33064C12.1754 9.33064 12.2625 9.31321 12.3437 9.27937C12.425 9.24552 12.4987 9.19593 12.5607 9.13344L13.5073 8.18677C13.9101 7.78018 14.2219 7.29264 14.4221 6.75647C14.6222 6.22029 14.7061 5.64771 14.6683 5.07664C14.6305 4.50558 14.4718 3.94907 14.2027 3.44397C13.9336 2.93887 13.5602 2.49671 13.1073 2.14677V2.14677Z"
                          fill="white"
                        />
                      </svg>
                    </span>
                    <p>{label}</p>
                  </div>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <h3>Experiments</h3>
      <div className={clsx(s.box, s.noPadding)}>
        <ol>
          {experiments.map(({ title, href, tags, contributors }, idx) => (
            <li className={s.boxEntry} key={href}>
              <Link href={href}>
                <a>
                  <div className={s.experimentInner}>
                    <div className={s.info}>
                      <span className={s.leftSign}>{idx + 1}</span>
                      <h4>{title}</h4>
                    </div>
                    <div className={s.tags}>
                      {tags.map((tag) => (
                        <span key={tag} className={s.tag}>
                          {tag}
                        </span>
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
                </a>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </div>
)

export default Welcome
