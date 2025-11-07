// FDCalculator.jsx
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
import styles from "./FDCalculator.module.css";

const FDCalculator = () => {
  const [formData, setFormData] = useState({
    principal: "",
    interestRate: "",
    tenure: "",
    tenureType: "years",
    compounding: "yearly",
  });

  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateFD = (e) => {
    e.preventDefault();

    const principal = parseFloat(formData.principal);
    const annualRate = parseFloat(formData.interestRate) / 100;
    let tenure = parseFloat(formData.tenure);

    // Convert tenure to years based on selection
    if (formData.tenureType === "months") {
      tenure = tenure / 12;
    }

    let n; // compounding frequency
    switch (formData.compounding) {
      case "yearly":
        n = 1;
        break;
      case "half-yearly":
        n = 2;
        break;
      case "quarterly":
        n = 4;
        break;
      case "monthly":
        n = 12;
        break;
      default:
        n = 1;
    }

    const amount = principal * Math.pow(1 + annualRate / n, n * tenure);
    const interestEarned = amount - principal;

    setResult({
      principal,
      maturityAmount: amount,
      interestEarned,
      totalInvestment: principal,
    });
  };

  const resetCalculator = () => {
    setFormData({
      principal: "",
      interestRate: "",
      tenure: "",
      tenureType: "years",
      compounding: "yearly",
    });
    setResult(null);
  };

  return (
    <div className={styles.fdPage}>
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
                  FD <span className={styles.gradientText}>CALCULATOR</span>
                </h1>
                <p className={styles.heroSubtitle}>
                  Calculate your Fixed Deposit maturity amount and interest
                  earnings with precision
                </p>
                <div className={styles.taglineContainer}>
                  <p className={styles.tagline}>Secure Your Financial Future</p>
                </div>
                <p className={styles.description}>
                  Use our advanced FD calculator to estimate your fixed deposit
                  returns. Plan your investments strategically to maximize
                  earnings while ensuring capital safety.
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
                    <h4 className={styles.sectionTitle}>FD Calculation</h4>
                    <p className={styles.sectionSubtitle}>
                      Enter your deposit details to calculate returns
                    </p>
                  </div>

                  <Form onSubmit={calculateFD} className={styles.form}>
                    <Form.Group className={`mb-4 ${styles.formGroup}`}>
                      <Form.Label className={styles.formLabel}>
                        Principal Amount (₹)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="principal"
                        value={formData.principal}
                        onChange={handleChange}
                        placeholder="Enter principal amount"
                        required
                        min="0"
                        className={styles.formControl}
                      />
                      <Form.Text className={styles.formText}>
                        Enter the amount you want to deposit
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className={`mb-4 ${styles.formGroup}`}>
                      <Form.Label className={styles.formLabel}>
                        Annual Interest Rate (%)
                      </Form.Label>
                      <Form.Control
                        type="number"
                        name="interestRate"
                        value={formData.interestRate}
                        onChange={handleChange}
                        placeholder="Enter interest rate"
                        required
                        min="0"
                        step="0.01"
                        className={styles.formControl}
                      />
                      <Form.Text className={styles.formText}>
                        Annual interest rate offered by the bank
                      </Form.Text>
                    </Form.Group>

                    <Row>
                      <Col md={8}>
                        <Form.Group className={`mb-4 ${styles.formGroup}`}>
                          <Form.Label className={styles.formLabel}>
                            Tenure
                          </Form.Label>
                          <Form.Control
                            type="number"
                            name="tenure"
                            value={formData.tenure}
                            onChange={handleChange}
                            placeholder="Enter tenure"
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
                            name="tenureType"
                            value={formData.tenureType}
                            onChange={handleChange}
                            className={styles.formControl}
                          >
                            <option value="years">Years</option>
                            <option value="months">Months</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className={`mb-4 ${styles.formGroup}`}>
                      <Form.Label className={styles.formLabel}>
                        Compounding Frequency
                      </Form.Label>
                      <Form.Select
                        name="compounding"
                        value={formData.compounding}
                        onChange={handleChange}
                        className={styles.formControl}
                      >
                        <option value="yearly">Yearly</option>
                        <option value="half-yearly">Half-Yearly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="monthly">Monthly</option>
                      </Form.Select>
                      <Form.Text className={styles.formText}>
                        How often interest is compounded
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
                      <h4 className={styles.sectionTitle}>FD Results</h4>
                      <p className={styles.sectionSubtitle}>
                        Your fixed deposit analysis
                      </p>
                    </div>

                    <div className={styles.resultSummary}>
                      <div className={styles.resultGrid}>
                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>💰</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Principal Amount
                            </span>
                            <span className={styles.resultValue}>
                              ₹{result.principal.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>📈</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Interest Earned
                            </span>
                            <span className={styles.resultValue}>
                              ₹
                              {result.interestEarned.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>🎯</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Maturity Amount
                            </span>
                            <span
                              className={`${styles.resultValue} ${styles.highlight}`}
                            >
                              ₹
                              {result.maturityAmount.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>

                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>📊</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Total Investment
                            </span>
                            <span className={styles.resultValue}>
                              ₹{result.totalInvestment.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div className={styles.resultItem}>
                          <div className={styles.resultIcon}>📅</div>
                          <div className={styles.resultContent}>
                            <span className={styles.resultLabel}>
                              Return on Investment
                            </span>
                            <span
                              className={`${styles.resultValue} ${styles.success}`}
                            >
                              {(
                                (result.interestEarned / result.principal) *
                                100
                              ).toFixed(2)}
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.resultNote}>
                        <p className={styles.successNote}>
                          ✅ Your fixed deposit will grow to ₹
                          {result.maturityAmount.toLocaleString("en-IN", {
                            maximumFractionDigits: 2,
                          })}{" "}
                          at maturity.
                        </p>
                      </div>
                    </div>

                    <div className={styles.breakdown}>
                      <h6 className={styles.breakdownTitle}>
                        Investment Breakdown
                      </h6>
                      <Table bordered className={styles.resultTable}>
                        <thead className={styles.tableHeader}>
                          <tr>
                            <th>Component</th>
                            <th>Amount (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>Total Investment</td>
                            <td>
                              ₹{result.totalInvestment.toLocaleString("en-IN")}
                            </td>
                          </tr>
                          <tr>
                            <td>Total Interest</td>
                            <td>
                              ₹
                              {result.interestEarned.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                          <tr className={styles.totalRow}>
                            <td>
                              <strong>Maturity Value</strong>
                            </td>
                            <td>
                              <strong>
                                ₹
                                {result.maturityAmount.toLocaleString("en-IN", {
                                  maximumFractionDigits: 2,
                                })}
                              </strong>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
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
                      <div className={styles.placeholderIcon}>🏦</div>
                      <h5 className={styles.placeholderTitle}>
                        Enter FD Details
                      </h5>
                      <p className={styles.placeholderText}>
                        Fill in the form to see your fixed deposit maturity
                        amount and interest earnings
                      </p>
                      <div className={styles.placeholderFeatures}>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>💰</span>
                          <span>Accurate Calculations</span>
                        </div>
                        <div className={styles.featureItem}>
                          <span className={styles.featureIcon}>📈</span>
                          <span>Interest Projections</span>
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
                      About Fixed Deposits (FD)
                    </h4>
                  </div>
                  <p className={styles.sectionSubtitle}>
                    A Fixed Deposit (FD) is a financial instrument provided by
                    banks and NBFCs which offers investors a higher rate of
                    interest than a regular savings account, until the given
                    maturity date.
                  </p>

                  <Row className="mt-4">
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>🛡️</div>
                        <div>
                          <h6>Safety & Security</h6>
                          <p>
                            FDs are considered one of the safest investment
                            options with guaranteed returns
                          </p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>📊</div>
                        <div>
                          <h6>Fixed Returns</h6>
                          <p>
                            Offers predictable, fixed returns that are not
                            market-linked
                          </p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>⚡</div>
                        <div>
                          <h6>Flexible Tenure</h6>
                          <p>
                            Choose tenure from 7 days to 10 years as per your
                            financial goals
                          </p>
                        </div>
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className={styles.infoItem}>
                        <div className={styles.infoIcon}>🏦</div>
                        <div>
                          <h6>Loan Facility</h6>
                          <p>
                            Can avail loans against FDs up to 75-90% of the
                            deposit value
                          </p>
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

export default FDCalculator;
