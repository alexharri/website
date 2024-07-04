---
title: "The State of Iceland's software industry in 2024"
description: "Analysing compensation figures, programming languages, tech stacks and other data from Iceland's 2024 developer survey."
publishedAt: ""
image: ""
---

A survey for Icelandic developers was conducted earlier this year by Kolibri. This survey was fairly comprehensive, gathering information on compensation, programming languages, CI/CD practices, AI assistant usage, and demographic information such as age, experience and gender.

This post will present the results from the survey, breaking down and joining the data in various ways.

## Demographics

425 developers responded to the survey. With only a few thousand software developers in Iceland, this constitutes a significant portion of Icelandic software developers. The majority of respondents were aged 25 to 54.

<BarChart data="age-count" width={640} horizontal />

Of the respondents who specified their gender (397), a large majority of the respondents were men (86.1%), with the rest being women and a small number of non-binary respondents.

<BarChart data="gender-count" width={500} height={300} />

Of those 396 respondents who specified their nationality, 384 were Icelandic (96.9%). This low number of non-Iceland respondents is likely due to the survey primarily being circulated through an Icelandic Facebook group for software developers. I would estimate the real proportion of non-Icelandic software developers to be much higher than just 3%.


## Experience

The following chart shows the experience of the respondents.

<BarChart data="years-of-experience-count" width={640} horizontal />

We can get more information by comparing experience across age cohorts. The below chart shows years of experience, grouped by the age cohorts.

<BarChart data="experience-by-age" horizontal stacked width={660} height={300} />

Most developers aged 45 or above have over 20 years of experience, indicating that most older developers started their career in their 20s. Looking at the younger age cohorts indicates that most of them started their career in their 20s as well, with a smaller percentage starting in their 30s or 40s.


## Developer types

Respondents were asked which type of developer they consider themselves to be. They could pick more than one type.

<BarChart data="dev-types-count" width={640} />

Perhaps the most immediately obvious fact that jumps out is how many developers classify themselves as full-stack developers—definitely more than I would have expected! I made one notable change to the data which influenced that:

 * If a developer classified themselves as both a front-end and back-end developer, I classified them as a full-stack developer (in case they had not done so themselves).
 * After that, if a developer is classified as a full-stack developer, they were _not_ classified as a front-end or back-end developer.

This change means that front-end, back-end and full-stack are _mutually exclusive_ developer types. I feel that this gives a better sense of the real numbers of front-end vs back-end vs full-stack developers.

## Back-end programming languages

The survey asked which back-end programming languages respondents had used within the last year. Only respondents that classified themselves as back-end or full-stack developers were asked this question.

<BarChart data="languages-count" width={640} />

<SmallNote>The languages colored blue were provided as default options in the survey, while the languages colored green were typed in the "Other" field. Languages used by fewer than 3 respondents are not included.</SmallNote>

The top back-end programming language in Iceland is C#, with 46.1% of Icelandic developers using it. After C#, we get TypeScript (40.4%), Python (38.6%) and JavaScript (32.6%). The next two languages, Go and Java, come in at 17.9% and 15.4% respectively.

Some observations:

 * SQL at 1.3% usage is _obviously_ not accurate. I would expect most back-end and full-stack developer to have reported using it if it had been provided as a default option.
 * C++ at 3.4% is far too low as well. I would guesstimate that C++ would be in the 8-15% range had it been included as a default option.

Aside from those obvious anomalies the data seems accurate to me. C# is heavily used in Icelandic companies, with it being the go-to back-end development language for most Icelandic companies.

TypeScript, as the data shows, has been widely adopted in Iceland. In my experience, TypeScript is generally strongly preferred over plain JavaScript, though not universally. In this survey, 74% of those that use JavaScript also reported using TypeScript, while 60% of those using TypeScript reported also using JavaScript.

Python being heavily used is no surprise to me, and the usage of Go and Rust are in line with what I would have expected.

### Comparison to Stack Overflow's survey

Let's compare this to the results of [Stack Overflow's 2023 Developer Survey][so_2023_tech]:

[so_2023_tech]: https://survey.stackoverflow.co/2023/#most-popular-technologies-language-prof

<BarChart data="languages-percentage-v-stackoverflow" percentage width={640} />

One obvious issue with this comparison is that the State of Iceland survey specifically asked about _back-end_ languages, while Stack Overflow's survey did not make that distinction. This may be part of the wide gap in usage between JavaScript in Iceland vs globally, and also why the percentages are generally higher in Stack Overflow's survey

Still, a few key things stand out to me:

 * C# is super popular in Iceland. Perhaps as a direct consequence, Java is much less used in Iceland than globally.
 * TypeScript is more popular than JavaScript in Iceland, which is not the case globally.
 * PHP is much less used in Iceland than globally.


### Years of experience by programming languages

I was curious whether there would be a significant difference between the languages that experienced developers are using compared to less experienced ones, but that does not seem to be the case. The following chart shows language use by years of experience.

<BarChart data="language-by-experience" width={1000} />

We can glean _some_ patterns from this data, such as Java being used more by experienced developers. Still, I don't see any dramatic differences that couldn't be explained away by the small sample size.


## Salary

Icelandic developers are compensated well. Respondents were asked about their monthly salary, with the possible answers being one of six salary brackets:

{<table data-align="right">
<tbody>
  <tr> <th>ISK</th> <th>EUR</th> <th>USD</th> </tr>

  <tr> <td>0 - 800,000</td> <td>0 - 5,360</td> <td>0 - 5,760</td> </tr>
  <tr> <td>800,000 - 1,000,000</td> <td>5,360 - 6,700</td> <td>5,760 - 7,200</td> </tr>
  <tr> <td>1,000,000 - 1,200,000</td> <td>6,700 - 8,040</td> <td>7,200 - 8,640</td> </tr>
  <tr> <td>1,200,000 - 1,400,000</td> <td>8,040 - 9,380</td> <td>8,640 - 10,080</td> </tr>
  <tr> <td>1,400,000 - 1,600,000</td> <td>9,380 - 10,720</td> <td>10,080 - 11,520</td> </tr>
  <tr> <td>Over 1,600,000</td> <td>Over 10,720</td> <td>Over 11,520</td> </tr>
</tbody>
</table>}

<SmallNote>The EUR and USD figures are using an exchange rate of ISK 1 = EUR 0.0067 and ISK 1 = USD 0.0072, measured on the 2nd of July 2024.</SmallNote>

In Iceland we generally generally discuss monthly salaries instead of yearly, but in the US (and other countries) yearly salary figures are more common. Here is the same table with yearly salary figures.

{<table data-align="right">
<tbody>
  <tr> <th>ISK</th> <th>EUR</th> <th>USD</th> </tr>

  <tr> <td>0 - 9,600,000</td> <td>0 - 64,320</td> <td>0 - 69,120</td> </tr>
  <tr> <td>9,600,000 - 12,000,000</td> <td>64,320 - 80,400</td> <td>69,120 - 86,400</td> </tr>
  <tr> <td>12,000,000 - 14,400,000</td> <td>80,400 - 96,480</td> <td>86,400 - 103,680</td> </tr>
  <tr> <td>14,400,000 - 16,800,000</td> <td>96,480 - 112,560</td> <td>103,680 - 120,960</td> </tr>
  <tr> <td>16,800,000 - 19,200,000</td> <td>112,560 - 128,640</td> <td>120,960 - 138,240</td> </tr>
  <tr> <td>Over 19,200,000</td> <td>Over 128,640</td> <td>Over 138,240</td> </tr>
</tbody>
</table>}

The below chart shows monthly salary for developers in Iceland, split by age bracket.

<BarChart data="compensation-by-experience" normalize />

As a freshly minted developer, you can expect to earn under or around ISK 800K. Even though the first salary bracket goes to zero, I wouldn't expect many developers to be earning less than 650K unless they're entering the field without a degree.

With a few years of experience, most developers move from the &lt;800K to the 800K-1.0M bracket. And at 6 or more years of experience a lot of developers move into the &gt;1.0M brackets.

Summarizing this:

 * Developers starting their career can expect to earn under or around ISK 800K monthly (USD 70K yearly)
 * Developers with 3-10 of experience generally earn ISK 800K to 1.2M monthly (USD 70K to 100K yearly)
 * Developers with over 10 of experience generally earn ISK 1.0M to 1.4M monthly (USD 85K to 120K yearly)
 * A significant number of highly experienced developers (10 to 20+ years of experience) earn 1.4M to &gt;1.6M monthly (USD 120K to &gt;140K yearly)

TL;DR: the typical developer in Iceland earns around USD 85K to 120K yearly.

Here is a different view of the same compensation data, which I feel shows the story of how developers move into the higher salary brackets as they gain more experience.

<BarChart data="compensation-by-experience" stacked horizontal normalize />

### Salary by programming language

The following chart shows monthly salary grouped by language:

<BarChart data="compensation-by-language" horizontal stacked />

There is not a great deal of difference across languages, though salaries for developers using PHP and JavaScript developers seem to skew lower. The handful of Scala developers are raking in cash.

### Salary by developer type

As mentioned earlier, developers were asked to select their developer type, such as whether they're a front-end or a back-end developer. The following chart shows monthly salary, grouped by developer type.

<BarChart data="compensation-by-dev-type" horizontal stacked minResponses={6} />

### Gender differences in pay

I was curious as to whether there would be visible disparities in salaries across genders, but no visible difference can be seen from the survey data. I would chalk this up to the very low sample size. Still, here is the salary chart from earlier split by gender as well as years of experience.

<BarChart data="compensation-by-experience-by-gender" width={1200} normalize />

<SmallNote>For information on the gender pay gap in Iceland, see ["Unadjusted gender pay gap 9.1% in 2022"](https://www.statice.is/publications/news-archive/wages-and-income/unadjusted-gender-pay-gap-2022/) from Statistics Iceland</SmallNote>


## Putting developer salaries into context

Salary numbers are interesting, but there are other important factors which cannot be captured in raw salary numbers. The following chapters will discuss taxes, employer-provided benefits and work-life balance in Iceland.

### Taxes

We've been looking at gross salaries so far. In figuring out net salaries we need to look at Icelandic taxes. In 2024, Iceland has three tax brackets:

{<table data-align="right">
<tbody>
  <tr> <th>Income, per month</th> <th>Tax rate</th> </tr>

  <tr> <td>ISK 0 - 446,136</td> <td>31.48%</td> </tr>
  <tr> <td>ISK 446,137 - 1,252,501 </td> <td>37.98%</td> </tr>
  <tr> <td>Over ISK 1,252,501</td> <td>46.28%</td> </tr>
</tbody>
</table>}

<SmallNote label="Source">[https://www.skatturinn.is/english/individuals/tax-liability/](https://www.skatturinn.is/english/individuals/tax-liability/)</SmallNote>

There is a personal tax credit of ISK 64.926 per month, which lowers the effective tax rate. There are also other factors, such as the mandatory pension fund and voluntary pension insurance premiums.

To take a rough example, a developer earning a gross salary of ISK 1.2M is likely to have a net salary of around 780K-800K ISK. Don't take this number too seriously, it depends on a lot of factors.


### Employer provided benefits

Developers in Iceland often receive employer-provided benefits. Common ones include:

 * Subsidies for physical and/or mental wellness (e.g. gym membership or counseling)
 * Home internet and phone plans paid by employer
 * Lunch and snacks
 * Transportation subsidies (e.g. bus pass)
 * Mobile phones
 * Conferences (e.g. pick one yearly)

This of course varies by company, but most companies provide at least some of these. Every company I've worked for in Iceland has provided me with the first three benefits listed.


### Work-life balance and parental leave

With the obvious caveat of work-life balance varying by company, work-life balance for developers in Iceland is generally good. There will be some companies with terrible work-life balance, and some companies with really good work-life balance.

A notable factor to mention is Iceland's generous paid parental leave, which is 6 months for each parent with 2 of those months being transferrable to the other parent. This corresponds to about 26 weeks of parental leave for each parent.

Payments during parental leave are 80% of the persons salary, capped at ISK 700K. This means that payments during parental leave max out when earning ISK 875K or more, which applies to most developers in Iceland.

<SmallNote>For more information on paternal leave in Iceland, see [https://island.is/en/life-events/having-a-baby](https://island.is/en/life-events/having-a-baby)</SmallNote>


### Salaries in Iceland

Icelandic developer salaries fall on the higher end of the salary spectrum. The following chart shows the distribution of total compensation in Iceland using data from Statistics Iceland:

<BarChart data="avg-salary-percentage" percentage />

<SmallNote label="Source">[https://statice.is/statistics/society/wages-and-income/wages/](https://statice.is/statistics/society/wages-and-income/wages/)</SmallNote>

Converting this from monthly to yearly and from ISK to USD, we get a chart that's more easily understood by a global audience:

<BarChart data="avg-salary-percentage-usd" percentage />


## Industries

The survey asked developers which industry they worked in.

<BarChart data="industry-count" width={600} height={300} />

### Salaries by industry

Here is the salary information split by industry:

<BarChart data="compensation-by-industry" horizontal stacked />

We can see that salaries in the public sector skew lower and salaries in banking and finance skew higher. Not terribly surprising.

### Programming language usage by industry

Respondents could pick multiple languages, but they could only pick one industry. The following chart shows, for each language, which industry the respondents using the language work in.

<BarChart data="industry-by-language" horizontal stacked minResponses={5} />

We can see some patterns emerge:

 * Developers working in banking, finance and the public sector mostly use C#.
 * Rust, TypeScript, Python and Go are popular in startups.

### Startups

15.9% of developers—including myself—reported working in startups. Quite a high percentage!

Much of that can be attributed to Iceland's strong support system for startups. [Klak][klak] runs multiple startup accelerators like [Gulleggið][gullegg] and [Startup SuperNova][supernova]. There are many notable venture capital funds like [Brunnur][brunnur], [Frumtak][frumtak] and [Crowberry Capital][crowberry], in addition to the [Technology Development Fund][tech_dev_fund] which provides free capital for early-stage startups.

In addition to that, companies may receive up to a 20% tax deduction for expenses related to research and innovation for expenses up to ISK 1,100M each year, or around USD 7.9M.

<SmallNote label="Source">[https://www.skatturinn.is/atvinnurekstur/framtal-og-alagning/fradrattur-vegna-nyskopunar/](https://www.skatturinn.is/atvinnurekstur/framtal-og-alagning/fradrattur-vegna-nyskopunar/)</SmallNote>


[gullegg]: https://gulleggid.is/
[supernova]: https://www.nova.is/hradleid/startupsupernova
[klak]: https://klak.is/en/
[brunnur]: https://www.brunnurventures.com/
[frumtak]: https://frumtak.is/
[crowberry]: https://www.crowberrycapital.com/
[tech_dev_fund]: https://en.rannis.is/funding/research/technology-development-fund/


### Company size

With a population of around 380,000 people, Icelandic companies are generally small to medium-sized. Very few Icelandic companies, outside of municipalities and healthcare, reach over 1,000 employees.

<BarChart data="company-size-count" horizontal />

With the "over 300 people" being the most common choice, it may make sense to split that into more brackets (e.g. 300-600, 600-1000, over 1000) if the survey is conducted again.

Here we can see same data on company sizes, grouped by industry:

<BarChart data="company-size-by-industry" stacked horizontal width={900} height={300} />

As expected, developers working in the public sector or banking/finance work at larger companies, while developers in startups tend to work at smaller companies.

## Technology stacks

We'll now take a look at the technologies that developers use. We'll cover front-end libraries, cloud providers and CI/CD.

### Front-end libraries

<BarChart data="frontend-framework-count" width={600} />

<SmallNote>Like before, front-end libraries colored blue were provided as a default option in the survey, while the front-end libraries colored green were typed in the "Other" field.</SmallNote>

React completely dominates the front-end scene in Iceland, with Vue and Angular in a distant second and third place. In my experience, this data is representative—React is incredibly popular here. 

Some other observations:

 * Next.js is very popular in Iceland. Had it been included as a default option it would likely have been _much_ higher (I would personally estimate that over 50% of developers in Iceland using React also use Next.js).
 * The survey only included a few JavaScript libraries as default options. With C# being as popular as it is in Iceland, a fair number of respondents mentioned C# front-end solutions in the "Other" field. Blazor seems to be the most popular one.


### Cloud providers

<BarChart data="cloud-providers-count" horizontal />

<SmallNote>Default survey options are colored blue, while options typed in the "Other" field are colored green. Origo, Advania and 1984.is are local Icelandic cloud providers.</SmallNote>

AWS at 52.5% is the most popular cloud provider in Iceland, with Azure in second at 36.5%. Vercel and Cloudflare are also used by a significant number of developers, coming in at 22.6% and 17.6% respectively. Google Cloud is relatively far behind AWS and Azure with 16.2% of Icelandic developers using GCP.

Digital Ocean is the most notable cloud provider not included as a default option. Perhaps it would have ranked significantly higher had it been one of the default options.

#### Programming language usage by cloud provider

The following chart shows the usage of programming languages amongst developers using each cloud providers.

<BarChart data="cloud-providers-by-language" width={1000} />

Developers using Azure, Origo and Advania are _much_ more likely to use C# than developers using other cloud providers. Developers using Azure are around 2.5 times as likely to use C# compared to developers using AWS.

Usage of TypeScript and Python seems inversely correlated to usage of C#.

### Continuous integration and continuous delivery (CI/CD)

<BarChart data="ci-count" horizontal />

<SmallNote>Default survey options are colored blue, while options typed in the "Other" field are colored green. </SmallNote>

Most respondents use GitHub actions for CI/CD (52.5%). GitLab and Azure follow with 19.1% and 17.4% respectively.

## Operating system

<BarChart data="os-count" width={500} height={300} />

## Operating system by industry

<BarChart data="os-by-industry" width={640} />