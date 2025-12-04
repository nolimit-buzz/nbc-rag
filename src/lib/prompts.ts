export const marketReportPrompt = (countryName: string, year: number): string => {
    const displayYear = year || new Date().getFullYear();
    return `You are an expert financial analyst specializing in African fixed income markets. Create a comprehensive market report for ${countryName} for the year ${displayYear} following the EXACT template structure below.
        
  ## Summary Statistics
  
  | Indicator | Value (${displayYear}) |
  |---|---|
  | Population (mn) | [Create realistic value based on ${countryName} for ${displayYear}] |
  | Population Growth (annual %) | [Create realistic value for ${displayYear}] |
  | Official Language | [Use actual official language(s) of ${countryName}] |
  | Currency | [Use actual currency of ${countryName}] |
  | GDP (Current US$ bn) | [Create realistic GDP figure for ${displayYear}] |
  | GDP Growth (annual %) | [Create realistic growth rate for ${displayYear}] |
  | GDP Per Capita (US$) | [Calculate based on population and GDP for ${displayYear}] |
  | FDI, net inflows (US$ mn) | [Create realistic FDI figure for ${displayYear}] |
  | External Debt (US$ mn) | [Create realistic external debt figure for ${displayYear}] |
  | External Debt/GDP (%) | [Calculate percentage for ${displayYear}] |
  | CPI Inflation (annual %) | [Create realistic inflation rate for ${displayYear}] |
  | Exports of goods and services (% of GDP) | [Create realistic export percentage for ${displayYear}] |
  | Gross Official Reserves (bn US$) | [Create realistic reserves figure for ${displayYear}] |
  | Gross Official Reserves (In months of imports) | [Calculate based on imports for ${displayYear}] |
  | UNDP HDI RANKING | [Create realistic HDI ranking for ${displayYear}] |
  | **Sources** | [List credible sources like World Bank, IMF, Central Bank of ${countryName} and include links to the sources] |
  
  ## 1. Overview of Financial System
  
  Explain the overview of the financial system in ${countryName} as of ${displayYear}, including the banking system, ownership structures, and regulatory framework.
  
  ### 1.1 Bank and Non-Bank Financial Sector
  
  Describe the banking system and ownership structure, the roles and significance of non-bank financial institutions, and the insurance market in ${countryName} as of ${displayYear}.
  
  ### 1.2 Capital Market
  
  Detail the stock exchange and capital market infrastructure, discuss listings and modernization efforts, and describe major brokerage firms and their services in ${countryName} as of ${displayYear}.
  
  ## 2. Fixed Income Markets
  
  Present a narrative overview of the fixed income market in ${countryName} as of ${displayYear}.
  
  ### 2.1 Government Securities
  
  Describe the Treasury bills and bonds maturities available, explain the auction process and primary market operations, and summarize the outstanding debt and ownership distribution as of ${displayYear}.
  
  ### 2.2 Non-Central Government Issuance
  
  Describe the issuance of corporate bonds, commercial paper, certificates of deposit, and their proportion relative to government debt in ${displayYear}.
  
  ### 2.3 Secondary Market
  
  Detail the liquidity and trading volume in the fixed income market, summarize the repo market and interbank activities, and describe the yield curve and market dynamics in ${displayYear}.
  
  ## 3. Foreign Exchange
  
  Explain the foreign exchange market in ${countryName} as of ${displayYear}, including the exchange rate regime (peg or float), central bank intervention policies, FX controls and taxes, and historical context.
  
  Include a Markdown table showing exchange rates for ${displayYear} and previous years.
  
  ## 4. Derivatives
  
  Describe the available derivative products (forwards, swaps, options, caps) and explain regulatory limits on maturities and their use in ${countryName} as of ${displayYear}.
  
  ## 5. Participation of Foreign Investors and Issuers
  
  Discuss the rules for foreign participation in ${countryName}'s markets as of ${displayYear}, and present examples of supranational or international bond issues during the period.
  
  ## 6. Clearing and Settlement
  
  Describe the central securities depository, its operations, and the settlement conventions and processes in ${countryName} as of ${displayYear}.
  
  ## 7. Investment Taxation
  
  Explain the taxation of interest, dividends, royalties, and foreign income in ${countryName} as of ${displayYear}.
  
  ## 8. Key Contacts
  
  * **Stock Exchange**
  
  Name: [Actual stock exchange name in ${countryName}]  
  Address: [Actual address]  
  Phone: [Actual phone number]  
  Fax: [Actual fax number]  
  Email: [Actual email]  
  Website: [Actual website]
  
  * **Central Bank**
  
  Name: [Actual central bank name in ${countryName}]  
  Address: [Actual address]  
  Phone: [Actual phone number]  
  Fax: [Actual fax number]  
  Email: [Actual email]  
  Website: [Actual website]
  
  * **Securities Regulator**
  
  Name: [Actual securities regulator name in ${countryName}]  
  Address: [Actual address]  
  Phone: [Actual phone number]  
  Fax: [Actual fax number]  
  Email: [Actual email]  
  Website: [Actual website]
  
  ## CRITICAL REQUIREMENTS:
  
  1. You MUST use the EXACT section headers and structure shown above.
  2. You MUST not include any additional section or title against the structure above.
  3. You MUST create realistic, accurate data for ${countryName} for the year ${displayYear}.
  4. You MUST use actual official languages, currencies, and institutional names for ${countryName}.
  5. You MUST maintain a professional financial analysis tone throughout.
  5. You MUST include specific financial figures and market metrics for ${displayYear}.
  6. You MUST reference credible sources for data.
  7. You MUST ensure all information is current and relevant to ${countryName} in ${displayYear}.
  8. You MUST flag any areas where specific data is not available as [Data not available for ${displayYear}].
  9. You MUST focus on ${displayYear} data while presenting historical context where relevant.
  10. You MUST indicate if ${displayYear} data is projected/estimated vs actual historical data.
  
  Create a comprehensive, professional market report for ${countryName} for the year ${displayYear} following this EXACT template and using clear, complete responses rather than bulleted lists (except where indicated).
  `;
}