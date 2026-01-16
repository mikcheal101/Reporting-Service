;WITH CTEPortfolioReport AS (
  SELECT
    CONVERT(NVARCHAR, a.ID) AS [ERP ID],
    ISNULL(MIN(p.Customer), '') AS [NAME OF CUSTOMER],
    ISNULL(p.Type, '') AS [Product Type],
    ISNULL(p.Product, '') AS [PRODUCT CLASS 1],
    p.Rate AS [Interest Rate (%)],
    p.Tenor AS [LOAN TENOR],
    p.[Loan Amount] AS [LOAN AMOUNT],
    p.[Monthly Repayment] AS [RENTAL VALUE],
    dbo.Dynamic_portfolioTotalRepayment(a.ID) AS [TOTAL REPAYMENT],
    dbo.Dynamic_portfolioTotalOutstanding(a.ID, GETDATE()) AS [Total Outstanding Balance Without Extended Interest],
    dbo.Dynamic_portfolioTotalOutstanding(a.ID, GETDATE()) * -1 AS [Total Outstanding Balance With Extended Interest],
    dbo._portfolioPrincipal(a.ID) AS [PRINCIPAL],
    dbo._portfolioInterest(a.ID) AS [INTEREST],
    MIN(r.DueDate) AS [LOAN START DATE],
    DATEADD(
      DAY,
      -1,
      DATEADD(MONTH, p.Tenor - 1, MIN(r.DueDate))
    ) AS [LOAN END DATE],
    -- For CASE logic, convert Start Date to DATE
    CASE
      WHEN MIN(r.DueDate) > p.[Portfolio Date] THEN 'Pending'
      ELSE p.[ExpiryStatus]
    END AS [Expiry Status],
    CASE
      WHEN p.[ERPStatus] = 'Paid-Off' THEN 'Paid-Off'
      WHEN MIN(r.DueDate) > p.[Portfolio Date] THEN 'Pending'
      ELSE p.[Rosabon Classisfication]
    END AS [ROSABON CLASSIFICATION],
    ROUND(
      CASE
        WHEN EOMONTH(CAST(MIN(r.DueDate) AS date)) = EOMONTH(GETDATE()) THEN 1
        WHEN p.[ExpiryStatus] = 'Expired' THEN p.[Tenor]
        WHEN p.[ExpiryStatus] = 'Pending' THEN 0
        ELSE (
          (
            DATEDIFF(
              DAY,
              CAST(MIN(r.DueDate) AS date),
              EOMONTH(GETDATE())
            ) + 30
          ) / 30.0
        )
      END,
      0
    ) AS [Rentals to have been covered],
    p.[ERPStatus],
    p.[ExpiryStatus],
    dbo.CalculateIRR(a.ID) AS [EFFECTIVE INTEREST RATE]
  FROM
    Sales._tblTransactions a
    JOIN Sales._tblProductDetails pd ON a.Product_ID = pd.ID
    JOIN Sales._tblPortfoliolive p ON a.ID = p.[Tran ID]
    JOIN Leads._tblLeads s ON a.Customer_ID = s.ID
    JOIN Sales._tblRepayment r ON r.TransID = a.ID
    AND r.DueDate <= GETDATE()
    LEFT JOIN Sales._tblTransactionLeadEmploymentDetails tld ON tld.TransationID = a.ID
    AND tld.LeadID = a.Customer_ID
    LEFT JOIN _tblTransactionGuarantor g ON g.CustomerID = a.Customer_ID
    OUTER APPLY (
      SELECT
        TOP 1 *
      FROM
        Sales._tblTransactionsLeadNextOfKin nk
      WHERE
        nk.TransactionID = a.ID
        AND nk.LeadID = a.Customer_ID
    ) NOK
    LEFT JOIN HR._tbluser u ON u.ID = a.AccountOfficerID
  WHERE
    ISNULL(a.Status, 'Completed') IN ('Completed', 'Disbursed', 'Paid-off', 'nill-off')
    AND a.ID BETWEEN 88920 AND 89102
  GROUP BY
    a.ID,
    a.IBSID,
    a.Customer_ID,
    a.Status,
    a.Product_ID,
    a.AccountOfficerID,
    p.Customer,
    p.Surname,
    p.FirstName,
    p.MiddleName,
    p.Phone,
    p.[Phone 2],
    p.Email,
    p.[Official Email],
    p.BusinessSector,
    p.Title,
    p.Gender,
    p.Address,
    p.City,
    p.BVN,
    p.Type,
    p.Product,
    p.[RC Number],
    p.[TINNumber],
    p.Rate,
    p.Tenor,
    p.[Loan Amount],
    p.MonthlyIncome,
    p.ExistingDebt,
    p.RepaymentMode,
    p.[Monthly Repayment],
    p.Purpose,
    p.Security,
    p.[Booking Officer],
    p.EIR,
    p.DTI,
    p.RiskLevel,
    NOK.First_Name,
    NOK.Last_Name,
    NOK.Gender,
    NOK.Relationship,
    NOK.Phone_num,
    NOK.Address,
    u.First_Name,
    u.Last_Name,
    u.Branch,
    s.State,
    p.[Disbursement Date],
    p.[Portfolio Date],
    p.[ExpiryStatus],
    p.[ERPStatus],
    p.[Rosabon Classisfication]
),
CTERentals AS (
  SELECT
    p.*,
    ROUND(
      CASE
        WHEN p.[ExpiryStatus] = 'Expired' THEN 0
        WHEN p.[ROSABON CLASSIFICATION] = 'Paid-Off' THEN 0
        WHEN p.[ExpiryStatus] = 'Pending' THEN p.[Loan Tenor]
        ELSE (
          DATEDIFF(
            DAY,
            EOMONTH(GETDATE()),
            EOMONTH(CAST(p.[Loan End Date] AS date))
          ) / 30.0
        )
      END,
      0
    ) AS [Pending Rentals],
    ABS(
      CASE
        WHEN p.[Rental Value] = 0
        OR p.[Rental Value] IS NULL THEN 0
        ELSE p.[Total Outstanding Balance Without Extended Interest] / p.[Rental Value]
      END
    ) AS [Pending+Missed Rentals]
  FROM
    CTEPortfolioReport AS p
),
CTEPaidRentals AS (
  SELECT
    *,
    ROUND(
      CASE
        WHEN ([Pending+Missed Rentals] - [Pending Rentals]) < 0 THEN 0
        ELSE ([Pending+Missed Rentals] - [Pending Rentals])
      END,
      0
    ) AS [Missed Rentals]
  FROM
    CTERentals
),
CTEAmortization AS (
  SELECT
    p.*,
    (
      p.[Rentals to have been covered] - p.[Missed Rentals]
    ) AS [Paid Rentals],
    (
      (p.[PRINCIPAL] / p.[LOAN TENOR]) * (
        p.[Rentals to have been covered] - p.[Missed Rentals]
      )
    ) AS [PRINCIPAL REPAID],
    (
      (p.[PRINCIPAL] / p.[LOAN TENOR]) * (p.[Missed Rentals])
    ) AS [PRINCIPAL OVERDUE],
    CASE
      WHEN p.[Rentals to have been covered] = 0 THEN ''
      WHEN p.[ROSABON CLASSIFICATION] = 'Paid-Off' THEN ''
      WHEN p.[Missed Rentals] <= 0 THEN 'Performing'
      WHEN p.[Missed Rentals] > 0
      AND p.[Missed Rentals] <= 1 THEN 'Watchlisted'
      WHEN p.[Missed Rentals] > 1
      AND p.[Missed Rentals] <= 2 THEN 'Sub-Standard'
      WHEN p.[Missed Rentals] > 2
      AND p.[Missed Rentals] <= 3 THEN 'Doubtful'
      WHEN p.[Missed Rentals] > 3 THEN 'Lost'
      ELSE ''
    END AS [RISK/RETURN STATUS]
  FROM
    CTEPaidRentals p
),
CTEBalances AS (
  SELECT
    p.*,
    (
      (p.[INTEREST] / p.[LOAN TENOR]) * p.[PAID RENTALS]
    ) AS [INTEREST REPAID],
    (
      (p.[INTEREST] / p.[LOAN TENOR]) * p.[MISSED RENTALS]
    ) AS [INTEREST OVERDUE],
    CASE
      WHEN p.[ROSABON CLASSIFICATION] = 'Paid-Off' THEN 0
      ELSE p.[PRINCIPAL] - p.[PRINCIPAL REPAID]
    END AS [PRINCIPAL OUTSTANDING],
    p.[PRINCIPAL] AS [BEGINNING BALANCE]
  FROM
    CTEAmortization AS p
),
CTEInterestComputation AS (
  SELECT
    p.*,
    (-1 * p.[PRINCIPAL]) AS [INTEREST DUE],
    (dbo._computeInterestPaid(p.[ERP ID], p.[RENTAL VALUE], p.[Missed Rentals])) AS [PRORATED INTEREST],
    (dbo._computeInterestPaid(p.[ERP ID], p.[RENTAL VALUE], p.[LOAN TENOR])) AS [REDUCING BALANCE TOTAL INTEREST],
    (p.[INTEREST] - p.[INTEREST REPAID]) AS [INTEREST OUTSTANDING],
    (p.[INTEREST OVERDUE] + p.[PRINCIPAL OUTSTANDING]) AS [NEW BOOK BALANCE]
  FROM
    CTEBalances AS p
)
SELECT
  TOP(10) p.[ERP ID],
  p.[NAME OF CUSTOMER],
  p.[Product Class 1],
  p.[EFFECTIVE INTEREST RATE],
  p.[LOAN TENOR],
  p.[LOAN AMOUNT],
  p.[RENTAL VALUE],
  p.[TOTAL REPAYMENT],
  p.[TOTAL OUTSTANDING BALANCE WITHOUT EXTENDED INTEREST],
  p.[PRINCIPAL],
  p.[INTEREST],
  p.[LOAN START DATE],
  p.[LOAN END DATE],
  p.[EXPIRY STATUS],
  p.[PRINCIPAL REPAID],
  P.[PRINCIPAL OVERDUE],
  p.[PRINCIPAL OUTSTANDING],
  p.[INTEREST REPAID],
  p.[INTEREST OVERDUE],
  p.[INTEREST OUTSTANDING],
  p.[NEW BOOK BALANCE],
  p.[BEGINNING BALANCE],
  p.[RENTAL VALUE] AS [MONTHLY REPAYMENT],
  p.[PRORATED INTEREST],
  p.[REDUCING BALANCE TOTAL INTEREST],
  p.[INTEREST DUE]
FROM
  CTEInterestComputation AS p;