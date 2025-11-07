import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
} from "react-bootstrap";
import styles from "./SWPCalculator.module.css";

const SWPCalculator = () => {
  const [formData, setFormData] = useState({
    initialInvestment: "",
    withdrawalAmount: "",
    withdrawalFrequency: "monthly",
    expectedReturn: "",
    timePeriod: "",
  });

  const [result, setResult] = useState(null);
  const [withdrawalSchedule, setWithdrawalSchedule] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateSWP = (e) => {
    e.preventDefault();

    const initialInvestment = parseFloat(formData.initialInvestment);
    const withdrawalAmount = parseFloat(formData.withdrawalAmount);
    const annualReturn = parseFloat(formData.expectedReturn) / 100;
    const timePeriod = parseFloat(formData.timePeriod);

    let periodsPerYear, totalPeriods;
    switch (formData.withdrawalFrequency) {
      case "monthly":
        periodsPerYear = 12;
        break;
      case "quarterly":
        periodsPerYear = 4;
        break;
      case "yearly":
        periodsPerYear = 1;
        break;
      default:
        periodsPerYear = 12;
    }

    totalPeriods = timePeriod * periodsPerYear;
    const periodicReturn = annualReturn / periodsPerYear;

    // Calculate if SWP is sustainable
    let remainingAmount = initialInvestment;
    const schedule = [];
    let isSustainable = true;
    let monthsUntilDepletion = totalPeriods;

    for (let period = 1; period <= totalPeriods; period++) {
      // Add returns first
      const returns = remainingAmount * periodicReturn;
      remainingAmount += returns;

      // Then withdraw
      remainingAmount -= withdrawalAmount;

      schedule.push({
        period,
        returns,
        withdrawal: withdrawalAmount,
        remainingAmount: Math.max(0, remainingAmount),
      });

      if (remainingAmount <= 0 && isSustainable) {
        isSustainable = false;
        monthsUntilDepletion = period;
        break;
      }
    }

    const totalWithdrawals =
      withdrawalAmount * (isSustainable ? totalPeriods : monthsUntilDepletion);
    const totalReturns = schedule.reduce((sum, item) => sum + item.returns, 0);

    setResult({
      initialInvestment,
      totalWithdrawals,
      totalReturns,
      finalAmount: isSustainable ? remainingAmount : 0,
      isSustainable,
      monthsUntilDepletion,
    });
    setWithdrawalSchedule(schedule);
  };

  const resetCalculator = () => {
    setFormData({
      initialInvestment: "",
      withdrawalAmount: "",
      withdrawalFrequency: "monthly",
      expectedReturn: "",
      timePeriod: "",
    });
    setResult(null);
    setWithdrawalSchedule([]);
  };

  const getFrequencyLabel = () => {
    switch (formData.withdrawalFrequency) {
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly";
      case "yearly":
        return "Yearly";
      default:
        return "Monthly";
    }
  };

  return (
    <div className={styles.swpPage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={styles.heroOverlay}></div>
        </div>
        <Container>
          <Row className="justify-content-center text-center">
            <Col lg={10}>
              <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>
                  SWP <span className={styles.gradientText}>CALCULATOR</span>
                </h1>
                <p className={styles.heroSubtitle}>
                  Calculate your Systematic Withdrawal Plan returns and plan
                  your investments effectively
                </p>
                <div className={styles.taglineContainer}>
                  <p className={styles.tagline}>Plan Your Financial Future</p>
                </div>
                <p className={styles.description}>
                  Use our advanced SWP calculator to estimate your regular
                  income from mutual fund investments. Plan withdrawals
                  strategically to maximize returns while preserving your
                  capital.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Calculator Section */}
      <section className={styles.calculatorSection}>
        <Container>
          <Row className={styles.equalHeightRow}>
            <Col lg={6} className={styles.calculatorCol}>
              <Card className={`${styles.calculatorCard} ${styles.mainCard}`}>
                <Card.Body className={styles.cardBody}>
                  <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionTitle}>SWP Calculation</h4>
                    <p className={styles.sectionSubtitle}>
                      Enter your investment details to calculate returns
                    </p>
                  </div>

                  <Form onSubmit={calculateSWP} className={styles.form}>
                    <Form.Group className={`mb-4 ${styles.formGroup}`}>
                      <Form.Label className={styles.formLabel}>
                        Initial Investment (₹)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="initialInvestment"
                        value={formData.initialInvestment}
                        onChange={handleChange}
                        placeholder="Enter initial investment amount"
                        required
                        min="0"
                        className={styles.formControl}
                      />
                      <Form.Text className={styles.formText}>
                        Enter the amount you want to invest
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className={`mb-4 ${styles.formGroup}`}>
                      <Form.Label className={styles.formLabel}>
                        Withdrawal Amount (₹)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="withdrawalAmount"
                        value={formData.withdrawalAmount}
                        onChange={handleChange}
                        placeholder="Enter withdrawal amount"
                        required
                        min="0"
                        className={styles.formControl}
                      />
                      <Form.Text className={styles.formText}>
                        Amount to withdraw periodically
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className={`mb-4 ${styles.formGroup}`}>
                      <Form.Label className={styles.formLabel}>
                        Withdrawal Frequency
                      </Form.Label>
                      <Form.Select
                        name="withdrawalFrequency"
                        value={formData.withdrawalFrequency}
                        onChange={handleChange}
                        className={styles.formControl}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group className={`mb-4 ${styles.formGroup}`}>
                      <Form.Label className={styles.formLabel}>
                        Expected Annual Return (%)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="expectedReturn"
                        value={formData.expectedReturn}
                        onChange={handleChange}
                        placeholder="Enter expected return rate"
                        required
                        min="0"
                        step="0.01"
                        className={styles.formControl}
                      />
                      <Form.Text className={styles.formText}>
                        Annual expected return rate
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className={`mb-4 ${styles.formGroup}`}>
                      <Form.Label className={styles.formLabel}>
                        Time Period (Years)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="timePeriod"
                        value={formData.timePeriod}
                        onChange={handleChange}
                        placeholder="Enter time period in years"
                        required
                        min="0"
                        className={styles.formControl}
                      />
                      <Form.Text className={styles.formText}>
                        Investment period in years
                      </Form.Text>
                    </Form.Group>

                    <div className={styles.buttonGroup}>
                      <Button type="submit" className={styles.primaryBtn}>
                        <span className={styles.btnIcon}>📊</span>
                        Calculate Returns
                      </Button>
                      <Button
                        type="button"
                        onClick={resetCalculator}
                        className={styles.secondaryBtn}
                      >
                        Reset
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className={styles.calculatorCol}>
              {result ? (
                <Card className={`${styles.resultCard} ${styles.mainCard}`}>
                  <Card.Body className={styles.cardBody}>
                    <div className={styles.sectionHeader}>
                      <h4 className={styles.sectionTitle}>SWP Results</h4>
                      <p className={styles.sectionSubtitle}>
                        Your withdrawal plan analysis
                      </p>
                    </div>

                    <div className={styles.resultSummary}>
                      <div className={styles.resultGrid}>
                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>💰</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Initial Investment
                            </span>
                            <span className={styles.resultValue}>
                              ₹
                              {result.initialInvestment.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>📤</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Total Withdrawals
                            </span>
                            <span className={styles.resultValue}>
                              ₹
                              {result.totalWithdrawals.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>📈</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Total Returns
                            </span>
                            <span className={styles.resultValue}>
                              ₹
                              {result.totalReturns.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        {result.isSustainable ? (
                          <div className={styles.resultItem}>
                            <div className={styles.resultIcon}>🎯</div>
                            <div className={styles.resultContent}>
                              <span className={styles.resultLabel}>
                                Final Amount
                              </span>
                              <span
                                className={`${styles.resultValue} ${styles.highlight}`}
                              >
                                ₹
                                {result.finalAmount.toLocaleString("en-IN", {
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.resultItem}>
                            <div className={styles.resultIcon}>⏰</div>
                            <div className={styles.resultContent}>
                              <span className={styles.resultLabel}>
                                Plan Duration
                              </span>
                              <span
                                className={`${styles.resultValue} ${styles.warning}`}
                              >
                                {result.monthsUntilDepletion}{" "}
                                {getFrequencyLabel().toLowerCase()} withdrawals
                              </span>
                            </div>
                          </div>
                        )}

                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>
                            {result.isSustainable ? "✅" : "⚠️"}
                          </div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>Status</span>
                            <span
                              className={`${styles.resultValue} ${
                                result.isSustainable
                                  ? styles.success
                                  : styles.danger
                              }`}
                            >
                              {result.isSustainable
                                ? "Sustainable"
                                : "Not Sustainable"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.resultNote}>
                        {result.isSustainable ? (
                          <p className={styles.successNote}>
                            ✅ Your withdrawal plan is sustainable for the
                            entire period.
                          </p>
                        ) : (
                          <p className={styles.warningNote}>
                            ⚠️ Your funds will be depleted after{" "}
                            {result.monthsUntilDepletion}{" "}
                            {getFrequencyLabel().toLowerCase()} withdrawals.
                          </p>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ) : (
                <Card
                  className={`${styles.placeholderCard} ${styles.mainCard}`}
                >
                  <Card.Body
                    className={`${styles.cardBody} ${styles.placeholderBody}`}
                  >
                    <div className={styles.placeholderContent}>
                      <div className={styles.placeholderIcon}>💰</div>
                      <h5 className={styles.placeholderTitle}>
                        Enter SWP Details
                      </h5>
                      <p className={styles.placeholderText}>
                        Fill in the form to see your withdrawal plan results and
                        analysis
                      </p>
                      <div className={styles.placeholderFeatures}>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>📊</span>
                          <span>Detailed Analysis</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>📈</span>
                          <span>Return Projections</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>⚡</span>
                          <span>Instant Results</span>
                        </div>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </Col>
          </Row>

          {withdrawalSchedule.length > 0 && (
            <Row className="mt-4">
              <Col>
                <Card className={styles.scheduleCard}>
                  <Card.Body className={styles.cardBody}>
                    <div className={styles.sectionHeader}>
                      <h4 className={styles.sectionTitle}>
                        Withdrawal Schedule
                      </h4>
                      <p className={styles.sectionSubtitle}>
                        First 12 periods of your withdrawal plan
                      </p>
                    </div>
                    <div className="table-responsive">
                      <Table className={styles.resultTable}>
                        <thead className={styles.tableHeader}>
                          <tr>
                            <th>Period</th>
                            <th>Returns (₹)</th>
                            <th>Withdrawal (₹)</th>
                            <th>Remaining Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {withdrawalSchedule
                            .slice(0, 12)
                            .map((periodData, index) => (
                              <tr key={index}>
                                <td>{periodData.period}</td>
                                <td>
                                  {periodData.returns.toLocaleString("en-IN", {
                                    maximumFractionDigits: 2,
                                  })}
                                </td>
                                <td>
                                  {periodData.withdrawal.toLocaleString(
                                    "en-IN",
                                    { maximumFractionDigits: 2 }
                                  )}
                                </td>
                                <td>
                                  {periodData.remainingAmount.toLocaleString(
                                    "en-IN",
                                    { maximumFractionDigits: 2 }
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </div>
                    {withdrawalSchedule.length > 12 && (
                      <p className={styles.tableNote}>
                        Showing first 12 of {withdrawalSchedule.length} periods
                      </p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </section>

      {/* Info Section */}
      <section className={styles.infoSection}>
        <Container>
          <Row>
            <Col>
              <Card className={styles.infoCard}>
                <Card.Body className={styles.cardBody}>
                  <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionTitle}>
                      About Systematic Withdrawal Plan (SWP)
                    </h4>
                  </div>
                  <p className={styles.sectionSubtitle}>
                    SWP is a facility offered by mutual funds where you can
                    withdraw a fixed amount regularly from your mutual fund
                    investments.
                  </p>

                  <Row className="mt-4">
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>💰</div>
                        <div>
                          <h6>Regular Income</h6>
                          <p>
                            Get a steady stream of income from your investments
                          </p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>📊</div>
                        <div>
                          <h6>Tax Efficiency</h6>
                          <p>
                            Withdrawals are treated as capital returns, making
                            them potentially tax-efficient
                          </p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>⚡</div>
                        <div>
                          <h6>Flexibility</h6>
                          <p>
                            Choose withdrawal frequency and amount as per your
                            needs
                          </p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>🛡️</div>
                        <div>
                          <h6>Wealth Preservation</h6>
                          <p>Your principal continues to earn returns</p>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default SWPCalculator;
