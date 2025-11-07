// SIPCalculator.jsx
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
import styles from "./SIPCalculator.module.css";

const SIPCalculator = () => {
  const [formData, setFormData] = useState({
    monthlyInvestment: "",
    expectedReturn: "",
    timePeriod: "",
    timePeriodType: "years",
  });

  const [result, setResult] = useState(null);
  const [yearlyBreakdown, setYearlyBreakdown] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateSIP = (e) => {
    e.preventDefault();

    const monthlyInvestment = parseFloat(formData.monthlyInvestment);
    const annualReturn = parseFloat(formData.expectedReturn) / 100;
    let timePeriod = parseFloat(formData.timePeriod);

    // Convert to months for calculation
    if (formData.timePeriodType === "years") {
      timePeriod = timePeriod * 12;
    }

    const monthlyReturn = annualReturn / 12;
    const totalMonths = timePeriod;

    // Calculate future value of SIP
    const futureValue =
      monthlyInvestment *
      ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn) *
      (1 + monthlyReturn);

    const totalInvestment = monthlyInvestment * totalMonths;
    const wealthGained = futureValue - totalInvestment;

    // Generate yearly breakdown
    const breakdown = [];
    let runningInvestment = 0;
    let runningValue = 0;

    for (let year = 1; year <= Math.ceil(totalMonths / 12); year++) {
      const monthsThisYear = Math.min(12, totalMonths - (year - 1) * 12);

      for (let month = 1; month <= monthsThisYear; month++) {
        runningInvestment += monthlyInvestment;
        runningValue = (runningValue + monthlyInvestment) * (1 + monthlyReturn);
      }

      breakdown.push({
        year,
        totalInvestment: runningInvestment,
        estimatedReturns: runningValue - runningInvestment,
        totalValue: runningValue,
      });
    }

    setResult({
      totalInvestment,
      wealthGained,
      futureValue,
      monthlyInvestment,
    });
    setYearlyBreakdown(breakdown);
  };

  const resetCalculator = () => {
    setFormData({
      monthlyInvestment: "",
      expectedReturn: "",
      timePeriod: "",
      timePeriodType: "years",
    });
    setResult(null);
    setYearlyBreakdown([]);
  };

  return (
    <div className={styles.sipPage}>
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
                  SIP <span className={styles.gradientText}>CALCULATOR</span>
                </h1>
                <p className={styles.heroSubtitle}>
                  Calculate your Systematic Investment Plan returns and achieve
                  your financial goals
                </p>
                <div className={styles.taglineContainer}>
                  <p className={styles.tagline}>Build Wealth Systematically</p>
                </div>
                <p className={styles.description}>
                  Use our advanced SIP calculator to estimate your mutual fund
                  returns through regular investments. Discover the power of
                  compounding and disciplined investing for long-term wealth
                  creation.
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
                    <h4 className={styles.sectionTitle}>SIP Calculation</h4>
                    <p className={styles.sectionSubtitle}>
                      Enter your investment details to calculate returns
                    </p>
                  </div>

                  <Form onSubmit={calculateSIP} className={styles.form}>
                    <Form.Group className={`mb-4 ${styles.formGroup}`}>
                      <Form.Label className={styles.formLabel}>
                        Monthly Investment (₹)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="monthlyInvestment"
                        value={formData.monthlyInvestment}
                        onChange={handleChange}
                        placeholder="Enter monthly investment amount"
                        required
                        min="0"
                        className={styles.formControl}
                      />
                      <Form.Text className={styles.formText}>
                        Amount you'll invest every month
                      </Form.Text>
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

                    <Row>
                      <Col md={8}>
                        <Form.Group className={`mb-4 ${styles.formGroup}`}>
                          <Form.Label className={styles.formLabel}>
                            Time Period
                          </Form.Label>
                          <Form.Control
                            type="number"
                            name="timePeriod"
                            value={formData.timePeriod}
                            onChange={handleChange}
                            placeholder="Enter time period"
                            required
                            min="0"
                            className={styles.formControl}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className={`mb-4 ${styles.formGroup}`}>
                          <Form.Label className={styles.formLabel}>
                            Period
                          </Form.Label>
                          <Form.Select
                            name="timePeriodType"
                            value={formData.timePeriodType}
                            onChange={handleChange}
                            className={styles.formControl}
                          >
                            <option value="years">Years</option>
                            <option value="months">Months</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

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
                      <h4 className={styles.sectionTitle}>SIP Results</h4>
                      <p className={styles.sectionSubtitle}>
                        Your investment growth analysis
                      </p>
                    </div>

                    <div className={styles.resultSummary}>
                      <div className={styles.resultGrid}>
                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>💰</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Monthly Investment
                            </span>
                            <span className={styles.resultValue}>
                              ₹
                              {result.monthlyInvestment.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>📤</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Total Investment
                            </span>
                            <span className={styles.resultValue}>
                              ₹
                              {result.totalInvestment.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>📈</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Wealth Gained
                            </span>
                            <span className={styles.resultValue}>
                              ₹
                              {result.wealthGained.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>🎯</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Future Value
                            </span>
                            <span
                              className={`${styles.resultValue} ${styles.highlight}`}
                            >
                              ₹
                              {result.futureValue.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>⚡</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Return on Investment
                            </span>
                            <span
                              className={`${styles.resultValue} ${styles.success}`}
                            >
                              {(
                                (result.wealthGained / result.totalInvestment) *
                                100
                              ).toFixed(2)}
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.resultNote}>
                        <p className={styles.successNote}>
                          ✅ Your investment shows strong growth potential
                          through compounding returns.
                        </p>
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
                      <div className={styles.placeholderIcon}>📈</div>
                      <h5 className={styles.placeholderTitle}>
                        Enter SIP Details
                      </h5>
                      <p className={styles.placeholderText}>
                        Fill in the form to see your investment growth
                        projections and analysis
                      </p>
                      <div className={styles.placeholderFeatures}>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>📊</span>
                          <span>Detailed Analysis</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>📈</span>
                          <span>Growth Projections</span>
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

          {yearlyBreakdown.length > 0 && (
            <Row className="mt-4">
              <Col>
                <Card className={styles.breakdownCard}>
                  <Card.Body className={styles.cardBody}>
                    <div className={styles.sectionHeader}>
                      <h4 className={styles.sectionTitle}>Yearly Breakdown</h4>
                      <p className={styles.sectionSubtitle}>
                        Complete investment growth over time
                      </p>
                    </div>
                    <div className="table-responsive">
                      <Table className={styles.resultTable}>
                        <thead className={styles.tableHeader}>
                          <tr>
                            <th>Year</th>
                            <th>Total Investment (₹)</th>
                            <th>Estimated Returns (₹)</th>
                            <th>Total Value (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yearlyBreakdown.map((yearData, index) => (
                            <tr key={index}>
                              <td>{yearData.year}</td>
                              <td>
                                {yearData.totalInvestment.toLocaleString(
                                  "en-IN",
                                  {
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>
                              <td>
                                {yearData.estimatedReturns.toLocaleString(
                                  "en-IN",
                                  {
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </td>
                              <td>
                                {yearData.totalValue.toLocaleString("en-IN", {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
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
                      About Systematic Investment Plan (SIP)
                    </h4>
                  </div>
                  <p className={styles.sectionSubtitle}>
                    SIP is an investment method offered by mutual funds where
                    you can invest a fixed amount regularly instead of making a
                    lump-sum investment.
                  </p>

                  <Row className="mt-4">
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>📊</div>
                        <div>
                          <h6>Rupee Cost Averaging</h6>
                          <p>
                            Buy more units when prices are low and fewer when
                            prices are high
                          </p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>🚀</div>
                        <div>
                          <h6>Power of Compounding</h6>
                          <p>
                            Earn returns on your returns over time for
                            exponential growth
                          </p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>⚡</div>
                        <div>
                          <h6>Disciplined Investing</h6>
                          <p>
                            Regular investments regardless of market conditions
                          </p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>💎</div>
                        <div>
                          <h6>Flexibility</h6>
                          <p>
                            Start with as low as ₹500 per month with easy
                            modifications
                          </p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>💰</div>
                        <div>
                          <h6>Liquidity</h6>
                          <p>Easy to redeem your investments when needed</p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>🛡️</div>
                        <div>
                          <h6>Long-term Wealth</h6>
                          <p>Ideal for achieving long-term financial goals</p>
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

export default SIPCalculator;
