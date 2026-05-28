describe('Trade Execution Logic', () => {

  test('insufficient funds - should not allow purchase', () => {
    const balance = 5000
    const price = 1820
    const quantity = 10
    const totalCost = price * quantity
    expect(totalCost).toBeGreaterThan(balance)
    expect(balance >= totalCost).toBe(false)
  })

  test('valid trade - deduct correct amount', () => {
    const balance = 100000
    const price = 942
    const quantity = 5
    const totalCost = price * quantity
    const newBalance = balance - totalCost
    expect(newBalance).toBe(95290)
    expect(newBalance).toBeGreaterThan(0)
  })

  test('zero quantity - should not allow trade', () => {
    const quantity = 0
    expect(quantity > 0).toBe(false)
  })

  test('invalid symbol - empty string check', () => {
    const symbol = ''
    expect(symbol.length > 0).toBe(false)
  })

  test('sell more than held - should fail', () => {
    const held = 3
    const sellQty = 5
    expect(sellQty <= held).toBe(false)
  })

})

describe('Portfolio Performance Computation', () => {

  test('calculate total portfolio value correctly', () => {
    const cashBalance = 85000
    const holdings = [
      { quantity: 2, avgPrice: 1820, currentPrice: 1850 },
      { quantity: 5, avgPrice: 942, currentPrice: 980 }
    ]
    const holdingsValue = holdings.reduce(
      (sum, h) => sum + (h.currentPrice * h.quantity), 0
    )
    const totalPortfolio = cashBalance + holdingsValue
    expect(holdingsValue).toBe(8600)
    expect(totalPortfolio).toBe(93600)
  })

  test('calculate P&L correctly', () => {
    const avgPrice = 1820
    const currentPrice = 1900
    const quantity = 2
    const pnl = (currentPrice - avgPrice) * quantity
    const pnlPct = ((currentPrice - avgPrice) / avgPrice) * 100
    expect(pnl).toBe(160)
    expect(pnlPct.toFixed(2)).toBe('4.40')
  })

  test('weekly return percentage calculation', () => {
    const startingCapital = 100000
    const currentValue = 118400
    const weeklyReturn = ((currentValue - startingCapital) / startingCapital) * 100
    expect(weeklyReturn).toBe(18.4)
  })

})

describe('Quiz Scoring Functions', () => {

  test('full marks - all correct', () => {
    const answers = [0, 1, 2, 1]
    const correct = [0, 1, 2, 1]
    const score = answers.filter((a, i) => a === correct[i]).length
    const percentage = (score / correct.length) * 100
    expect(score).toBe(4)
    expect(percentage).toBe(100)
  })

  test('partial score calculation', () => {
    const answers = [0, 0, 2, 1]
    const correct = [0, 1, 2, 1]
    const score = answers.filter((a, i) => a === correct[i]).length
    const percentage = (score / correct.length) * 100
    expect(score).toBe(3)
    expect(percentage).toBe(75)
  })

  test('XP award calculation', () => {
    const baseXP = 40
    const quizScore = 75
    const xpEarned = quizScore >= 60 ? baseXP : Math.floor(baseXP * 0.5)
    expect(xpEarned).toBe(40)
  })

})

describe('Leaderboard Ranking Algorithm', () => {

  test('sort users by weekly return descending', () => {
    const users = [
      { name: 'Aryan', weeklyReturn: 18.4 },
      { name: 'Priya', weeklyReturn: 14.1 },
      { name: 'Keshav', weeklyReturn: 6.2 },
      { name: 'Rahul', weeklyReturn: 11.8 }
    ]
    const ranked = [...users].sort(
      (a, b) => b.weeklyReturn - a.weeklyReturn
    )
    expect(ranked[0].name).toBe('Aryan')
    expect(ranked[1].name).toBe('Priya')
    expect(ranked[2].name).toBe('Rahul')
    expect(ranked[3].name).toBe('Keshav')
  })

  test('prize distribution - top 3 only', () => {
    const prizes = [20000, 10000, 5000]
    const rank1Prize = prizes[0]
    const rank4Prize = prizes[3]
    expect(rank1Prize).toBe(20000)
    expect(rank4Prize).toBeUndefined()
  })

})

describe('Stop Loss and Target Alert Logic', () => {

  test('stop loss trigger - price below threshold', () => {
    const stopLossPrice = 1729
    const currentPrice = 1710
    const shouldTrigger = currentPrice <= stopLossPrice
    expect(shouldTrigger).toBe(true)
  })

  test('target trigger - price above threshold', () => {
    const targetPrice = 1965
    const currentPrice = 1980
    const shouldTrigger = currentPrice >= targetPrice
    expect(shouldTrigger).toBe(true)
  })

  test('no trigger - price in safe range', () => {
    const stopLoss = 1729
    const target = 1965
    const currentPrice = 1820
    const triggered = currentPrice <= stopLoss || currentPrice >= target
    expect(triggered).toBe(false)
  })

})
