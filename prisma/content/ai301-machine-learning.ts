/**
 * AI301 Machine Learning — authored course content.
 *
 * Every other course in the seed is generated from a shared template: four units with
 * titles like "Core techniques" and a one-line placeholder body. That is fine for
 * demonstrating that the LMS renders a curriculum, and useless for demonstrating that
 * anyone could learn from it.
 *
 * This file is the exception. It is a real course — six units, twenty-four lessons, a
 * question bank and three assignments with marking rubrics — written to the level a
 * third-year undergraduate module would actually be taught at. It exists so there is at
 * least one course where clicking into a lesson gives you something to read, and so there
 * is a worked example of the shape authored content takes when the rest are written.
 *
 * Bodies are Markdown. Keep the register consistent: explain the mechanism, show the
 * arithmetic where arithmetic is the point, and be specific about what goes wrong.
 */

export type AuthoredLessonType = 'VIDEO' | 'READING' | 'LAB' | 'PDF' | 'SLIDES';

export type AuthoredLesson = {
  title: string;
  type: AuthoredLessonType;
  durationMins: number;
  body: string;
};

export type AuthoredModule = {
  title: string;
  summary: string;
  lessons: AuthoredLesson[];
};

export type AuthoredQuestion = {
  prompt: string;
  options: string[];
  /** Zero-based index into `options`. */
  correct: number;
  explanation: string;
};

export type AuthoredAssignment = {
  title: string;
  instructions: string;
  maxScore: number;
  weight: number;
  allowLate: boolean;
};

export type AuthoredCourse = {
  code: string;
  modules: AuthoredModule[];
  quiz: {
    title: string;
    description: string;
    durationMins: number;
    questionsToServe: number;
    questions: AuthoredQuestion[];
  };
  /** Exactly three, in the order the seed expects: marked, open, and future. */
  assignments: [AuthoredAssignment, AuthoredAssignment, AuthoredAssignment];
};

const modules: AuthoredModule[] = [
  {
    title: 'Unit 1: What "learning from data" actually means',
    summary:
      'The framing the rest of the course depends on: what a model is, what it is fitted to, and the assumption underneath all of it that quietly fails in production.',
    lessons: [
      {
        title: 'Course orientation: what you will be able to do by December',
        type: 'VIDEO',
        durationMins: 14,
        body: `A short introduction to how AI301 runs and what it expects of you.

**By the end of this course you should be able to:**

1. Take a messy tabular dataset and a vague business question, and turn them into a supervised learning problem with a defensible target variable.
2. Choose an evaluation metric that matches the cost of being wrong, and explain why accuracy is usually the wrong choice.
3. Diagnose whether a disappointing model is underfitting, overfitting, or being evaluated incorrectly — these have different fixes and are routinely confused.
4. Recognise data leakage before it flatters your results.

**How the course runs.** Six units, roughly two weeks each. Each unit has a recorded lecture, two readings, and a laboratory you complete in your own environment. There is a live seminar each Thursday; it is not recorded because people ask better questions when they are not being filmed.

**What is assessed.** A portfolio task (15%), an applied case study (15%), a final project (30%), a unit quiz (10%) and a final examination (30%). The project is the piece that matters most, and the one students consistently start too late.

**A word on prerequisites.** CS201 is required. You need to be comfortable with a for-loop, basic linear algebra notation, and the idea of a probability distribution. You do not need to have seen calculus recently — where we differentiate, the derivation is shown.`,
      },
      {
        title: 'Models, parameters, and the thing you are actually optimising',
        type: 'READING',
        durationMins: 35,
        body: `Machine learning gets introduced badly. The usual opening — "algorithms that learn from data without being explicitly programmed" — is a slogan, not a definition, and it leaves you unable to answer the first question that matters: *what is being decided when a model is fitted?*

Here is a more useful framing. Three things are always in play:

1. **A hypothesis space** — the set of functions your model is allowed to represent.
2. **A loss function** — a number saying how badly a particular function performs on the data you have.
3. **An optimiser** — a procedure for searching the hypothesis space for a function with low loss.

Every supervised method in this course is a choice of these three. Linear regression takes the space of straight lines, squared error as loss, and either a closed-form solution or gradient descent as the optimiser. A neural network takes an enormous space of composed non-linear functions, some task-specific loss, and stochastic gradient descent. The parts change; the structure does not.

## Why this framing earns its keep

It tells you where to look when things go wrong.

If your model cannot fit the training data at all, the hypothesis space is too small — a straight line cannot represent a curve, however good your optimiser. That is **underfitting**, and no amount of extra data fixes it.

If your model fits the training data perfectly and fails on new data, the hypothesis space was large enough to memorise. That is **overfitting**, and Unit 4 is entirely about it.

If the loss went down but the thing you care about did not improve, you optimised the wrong quantity. This is the most common failure in industry and the least discussed in textbooks. A model trained to minimise squared error on revenue will happily be wildly wrong about small customers, because their errors are small in absolute terms. If small customers matter, squared error was the wrong loss.

## Parameters and hyperparameters

**Parameters** are what the optimiser sets: the coefficients of a linear model, the weights of a network. You do not choose them, you fit them.

**Hyperparameters** are what you set before fitting: the learning rate, the depth of a tree, the strength of regularisation. They define the hypothesis space and the search, so they cannot be chosen by the same procedure that searches it — fitting them on the training data just recovers whatever memorises best. Unit 3 covers how to choose them honestly.

The distinction sounds bureaucratic until you notice that most reported "the model achieves 94%" results are quietly hyperparameter-tuned on the test set, which makes the number meaningless. We will come back to this repeatedly.

## The assumption underneath everything

Supervised learning assumes your training data and the data you will eventually predict on are drawn from the *same distribution*, independently. This is the **i.i.d. assumption**, and it is almost never exactly true.

It fails when:

- **Time passes.** A model trained on 2023 transactions meets 2026 customers. Fraud patterns in particular adapt specifically to your model, which is about as far from independent as it gets.
- **You deploy.** A loan model trained on people who *were granted loans* only ever saw the ones your existing process approved. The applicants it must now judge are a different population.
- **Data is collected differently.** A diagnostic model trained on one hospital's scanner learns that scanner's noise profile.

None of these are exotic. The i.i.d. assumption is the single most load-bearing and least examined idea in applied machine learning, and when a deployed model degrades for no apparent reason, this is usually where to look first.

**Next**, we make this concrete on a dataset small enough to check by hand.`,
      },
      {
        title: 'Supervised, unsupervised, and the framings in between',
        type: 'READING',
        durationMins: 30,
        body: `The textbook division is supervised versus unsupervised, and it is worth more scrutiny than it usually gets.

## Supervised learning

You have inputs \`X\` and known outputs \`y\`, and you want a function mapping one to the other. Two sub-cases:

- **Regression** — \`y\` is continuous. Predicting a house price, a delivery time, a rainfall total.
- **Classification** — \`y\` is a discrete label. Spam or not; which of five species; which of two thousand product categories.

The distinction matters more than it looks, because it changes the loss function and every evaluation metric. It also has an awkward middle: predicting a rating from 1 to 5 is neither cleanly regression (the gaps may not be equal) nor cleanly classification (the labels are ordered, and being wrong by one is better than being wrong by four). That is **ordinal regression**, and treating it as plain classification throws away the ordering — a mistake worth recognising.

## Unsupervised learning

You have \`X\` and no labels. You are looking for structure: groups that hang together, a lower-dimensional representation, points that do not belong.

The hard part is that **there is no ground truth to check against**. In supervised learning you can be wrong in a measurable way. In clustering, "wrong" is a matter of whether the structure you found is useful for something, which cannot be settled by the algorithm. Unit 6 deals with this honestly, including the uncomfortable fact that k-means will happily return five clusters from data with no cluster structure whatsoever.

## The framings in between

**Semi-supervised** learning: a few thousand labelled examples and a few million unlabelled ones. Common in practice, because labelling is expensive and data collection is not.

**Self-supervised** learning: manufacture labels from the data itself. Hide a word and predict it from its context; hide a patch of image and reconstruct it. This is how the large language and vision models of the last several years are trained, and it is best understood as supervised learning where the labelling is free.

**Reinforcement learning**: no fixed dataset at all. An agent acts, receives reward, and must discover which of its earlier actions deserve credit. A genuinely different problem, not covered here.

## Choosing the framing is a design decision

Students often assume the framing is given by the problem. It rarely is.

"Reduce customer churn" is not a machine learning problem until someone decides what churn means and over what horizon. Predict *whether* a customer cancels in the next 30 days (classification)? *When* they will cancel (survival analysis)? *How much revenue* is at risk (regression)? Each is defensible, each needs different data, and each produces a different system.

Getting this wrong is expensive and invisible: the model works exactly as specified and the business problem remains unsolved. **Deciding what to predict is most of the job.** It is also the part that cannot be automated, which is a reasonable thing to know about your own employability.`,
      },
      {
        title: 'Laboratory: your first end-to-end model, checked by hand',
        type: 'LAB',
        durationMins: 90,
        body: `**Objective.** Build a working regression model on a dataset small enough that you can verify the machine's arithmetic yourself. The point is not the model — it is the habit of not trusting output you have not checked.

**Data.** \`unit1/housing-small.csv\` on the course workspace: 60 rows, three columns — floor area (m²), distance to the station (km), sale price (thousands).

**Tasks**

1. Load the data. Plot price against area. Before fitting anything, write down the slope you expect, in thousands per m². You will compare against it.
2. Fit a linear regression using area alone. Report the coefficient and intercept.
3. Compare the fitted slope with your guess. If they differ by more than about 30%, work out which of you is wrong — this happens more often than students expect, and the dataset is small enough to inspect.
4. Compute the mean squared error by hand for the first five rows. Confirm it matches the library's figure on those rows.
5. Add distance to the station as a second feature. Does the area coefficient change? **It will.** Write two sentences on why adding a correlated feature moves an existing coefficient — this is the beginning of a problem we return to in Unit 5.
6. Find the three rows with the largest residuals. Look at them. Are they errors in the data, or genuinely unusual properties? Decide what you would do about each, and say why.

**What to submit.** A notebook with your working, including your initial guess from step 1 written *before* the fit. Marks are for the reasoning in steps 5 and 6, not for getting the model to run.

**Common sticking point.** If step 4 does not match, check whether your library divides by n or n−1, and whether it is reporting MSE or RMSE. Fully half of "the numbers do not agree" is one of these two.`,
      },
    ],
  },
  {
    title: 'Unit 2: Regression, classification, and how models are actually fitted',
    summary:
      'Linear and logistic regression from the loss function outwards, with gradient descent derived rather than asserted. The workhorses, and why they remain the sensible first thing to try.',
    lessons: [
      {
        title: 'Linear regression: the closed form and why nobody uses it',
        type: 'VIDEO',
        durationMins: 26,
        body: `Linear regression has an exact solution. Given a design matrix **X** and targets **y**, the coefficients minimising squared error are:

    β = (XᵀX)⁻¹ Xᵀy

This is the **normal equation**, it is exact, and it requires no iteration, no learning rate and no convergence check.

It is also, at any real scale, the wrong way to do it. This lecture covers why:

- **Cost.** Inverting XᵀX is roughly O(p³) in the number of features. At p = 100 that is nothing. At p = 100,000 it is intractable, and p = 100,000 is unremarkable for text features.
- **Numerical instability.** If two features are nearly collinear, XᵀX is nearly singular and the inversion amplifies floating-point error into nonsense coefficients — enormous, opposite in sign, cancelling each other out.
- **It does not generalise.** The moment your loss is not squared error — logistic loss, hinge loss, anything robust — the closed form disappears. Gradient descent survives the change.

So we teach the closed form because it makes the objective concrete and gives an exact answer to check against on small problems, and then we spend the rest of the course on iterative methods, because those are what scale.

**Watch for** the worked example at 14:20 where two near-identical features produce coefficients of +4,182 and −4,179. Nothing is broken. That is what an ill-conditioned inverse looks like, and it is exactly the problem regularisation solves in Unit 4.`,
      },
      {
        title: 'Gradient descent, derived',
        type: 'READING',
        durationMins: 40,
        body: `Gradient descent is often introduced by analogy — a ball rolling downhill, a hiker descending in fog. The analogies are fine and they do not tell you why it works or when it fails. This reading derives it.

## The setup

You have a loss \`L(β)\` — a single number depending on your parameters. You want the β that makes it small. You cannot see the whole surface; you can only evaluate the loss and its slope at wherever you currently stand.

The **gradient** ∇L(β) is the vector of partial derivatives: how much the loss changes per unit change in each parameter. It points in the direction of *steepest increase*. So to decrease the loss, step against it:

    β ← β − α ∇L(β)

where α is the **learning rate**. That is the entire algorithm. Everything else is refinement.

## Doing it for squared error

Take one training example (x, y) and a linear model ŷ = βᵀx. The squared error is:

    L = (ŷ − y)²

Differentiate with respect to one coefficient βⱼ, applying the chain rule:

    ∂L/∂βⱼ = 2(ŷ − y) · ∂ŷ/∂βⱼ = 2(ŷ − y) · xⱼ

Read that expression, because it is more interesting than it looks. The update to coefficient j is proportional to two things: **how wrong the prediction was** (ŷ − y), and **how much feature j contributed** (xⱼ). A feature that was zero for this example gets no update — it was not implicated. A prediction that was already correct produces no update at all.

The factor of 2 is conventionally absorbed into α, which is why you will see the loss written with a ½ in front. That ½ exists purely so the derivative comes out clean; it changes nothing.

## The learning rate is the whole game

Too small and training takes forever — you converge, eventually, having spent a week of GPU time to arrive where a better rate got you in an hour.

Too large and you overshoot the minimum, land further up the other side, overshoot again, and the loss **diverges**. If your loss goes to NaN within a few dozen steps, the learning rate is too high roughly nine times in ten.

There is no universally correct value. Sensible practice: start at 0.01, plot the loss against step count, and look at the shape. A healthy curve drops fast then flattens. A curve that oscillates wants a smaller rate. A curve that is nearly flat from the start wants a larger one — or your features need scaling, which is the next section.

## Why feature scaling matters more than students expect

Suppose one feature is measured in metres (range 0–200) and another as a fraction (range 0–1). The loss surface is a long, narrow valley: steep in the direction of the small-range feature, shallow in the other. Gradient descent bounces across the narrow direction while creeping along the valley floor.

A single learning rate must serve both directions, so it is forced down to whatever the steep direction tolerates, and progress along the shallow direction becomes glacial.

Standardising each feature to zero mean and unit variance makes the valley round. Convergence often improves by an order of magnitude. **This is the highest-value five lines of preprocessing in the course**, and it is routinely skipped.

## The three variants

- **Batch** gradient descent computes the gradient over the whole training set per step. Accurate, stable, and prohibitively slow on large data.
- **Stochastic** (SGD) uses one example per step. Very fast, very noisy — the loss jitters rather than descending smoothly. The noise is not purely a defect; it can knock the optimiser out of poor local minima.
- **Mini-batch** uses 32 to 512 examples per step. Nearly all the stability of batch, nearly all the speed of stochastic, and it maps well onto vectorised hardware. This is what essentially everything uses in practice.

**Next**, the same machinery applied to classification, where the target is a label rather than a number.`,
      },
      {
        title: 'Logistic regression: predicting probabilities, not classes',
        type: 'READING',
        durationMins: 35,
        body: `Classification looks like it needs new machinery. It mostly does not — it needs a different output transformation and a different loss, and the optimiser carries over unchanged.

## Why not just use linear regression?

Code the labels 0 and 1 and fit a line. Two things break.

First, the output is unbounded. A sufficiently large feature value yields a prediction of 3.7, which is not a probability of anything.

Second, and worse, squared error is the wrong penalty. If the true label is 1 and you predicted 0.99, squared error says you were slightly wrong. If you predicted 0.01, it says you were quite wrong. But confidently asserting the opposite of the truth deserves an enormous penalty, not a moderate one — and squared error's is bounded.

## The sigmoid

Squash the linear output into (0, 1):

    σ(z) = 1 / (1 + e⁻ᶻ)     where z = βᵀx

At z = 0 this gives 0.5. Large positive z approaches 1, large negative approaches 0, and it is smooth everywhere, so it is differentiable — which the optimiser requires.

The output is a **probability**, and taking that seriously is the most useful habit in this reading. A model saying 0.51 and one saying 0.99 both "predict the positive class", and treating them identically discards the thing that makes the model useful for making decisions.

## Log loss

The right loss for probabilities is **binary cross-entropy**:

    L = −[ y·log(ŷ) + (1−y)·log(1−ŷ) ]

Only one term is ever active — y is 0 or 1. If the true label is 1, the loss is −log(ŷ): zero when ŷ = 1, and rising *without bound* as ŷ approaches 0. That unboundedness is the point. Confident and wrong is arbitrarily bad, which is exactly the behaviour squared error lacked.

Now the pleasing part. Differentiate log loss with respect to βⱼ and the sigmoid's derivative cancels almost everything, leaving:

    ∂L/∂βⱼ = (ŷ − y) · xⱼ

Identical in form to linear regression. Error times feature. The gradient descent code does not change at all — only the forward pass and the loss.

## The threshold is not part of the model

A logistic model outputs 0.73. Whether that counts as "positive" depends on a **threshold**, and the threshold is a business decision, not a modelling one.

The default of 0.5 is a convention with no special status. For cancer screening, where a missed case is catastrophic and a false alarm means one more test, you might threshold at 0.1. For an automated account suspension, where a false positive locks out a paying customer, you might use 0.9.

Changing the threshold does not retrain anything. It moves you along a curve of possible trade-offs, and Unit 3 is about reading that curve.

## Why start here

Logistic regression remains, on tabular data, an entirely respectable baseline. It is fast, its coefficients are interpretable, it produces calibrated probabilities, and it will not embarrass you.

More importantly, **it is the control**. If a gradient-boosted ensemble beats logistic regression by half a point of AUC, that half point is what the complexity bought you, and you can decide whether it was worth it. Teams that skip the baseline never find out that their expensive model was barely better than a line.`,
      },
      {
        title: 'Laboratory: implementing gradient descent from scratch',
        type: 'LAB',
        durationMins: 120,
        body: `**Objective.** Write gradient descent yourself, in about forty lines, and watch every failure mode from the reading happen in front of you.

No machine learning libraries for parts 1–4. NumPy for the arithmetic is fine.

**Tasks**

1. Implement batch gradient descent for linear regression on \`unit2/synthetic.csv\`. Record the loss at every step and plot it.
2. Run it at learning rates 0.0001, 0.01, 0.1 and 1.0. Plot all four loss curves on one figure. Describe each in a sentence. One will diverge; say at which step you first knew.
3. Now the point of the exercise: **do not standardise the features** and re-run at your best rate. Compare the step count to convergence. Then standardise and re-run. Report both numbers.
4. Implement logistic regression by changing only the forward pass and the loss. Verify your gradient is right by comparing against a numerical estimate, \`(L(β + ε) − L(β − ε)) / 2ε\` with ε = 1e-5, for three coefficients. They should agree to about five decimal places.
5. Fit \`sklearn.linear_model.LogisticRegression\` on the same data. Compare coefficients. They will differ slightly — explain why. (Look up that library's default regularisation before you write your explanation.)

**Submission.** Your implementation, the two figures, and your answers to 3 and 5.

**Notes.** Step 4 is the most valuable habit in this laboratory. A wrong gradient does not crash — it trains, converges to something, and produces a model that is quietly worse than it should be. Numerical gradient checking catches in thirty seconds what otherwise costs a week.

If step 3 shows no difference, your synthetic features are probably already on similar scales; multiply one by 1000 and try again.`,
      },
    ],
  },
  {
    title: 'Unit 3: Evaluation, and why accuracy lies',
    summary:
      'How to find out whether a model is any good — held-out data, cross-validation, metrics that survive class imbalance, and the leakage that makes all of it meaningless.',
    lessons: [
      {
        title: 'Train, validation, test: three sets and three different jobs',
        type: 'VIDEO',
        durationMins: 22,
        body: `The single most common methodological error in student projects, and in a fair proportion of published papers, is evaluating on data that influenced the model.

**The three splits and what each is for:**

- **Training set** (~60%) — the optimiser fits parameters on this. The model sees it directly.
- **Validation set** (~20%) — you choose hyperparameters here: learning rate, tree depth, regularisation strength, which model family to use at all. The model does not train on it, but *you* make decisions from it.
- **Test set** (~20%) — touched once, at the very end, to estimate performance on unseen data.

The subtlety is in the middle. Every time you look at validation performance and change something, you leak a little information from that set into your model. After fifty experiments, validation performance is optimistic — you have effectively fitted your hyperparameters to it.

This is why the test set exists and why it must be used **once**. If you check test performance, do not like it, and go back to adjust the model, the test set has become a validation set and you no longer have an honest estimate. There is no way to undo this except collecting new data.

**Practical guidance in the lecture:** how to split when data is time-ordered (never randomly — always by time), when observations are grouped (split by group, or the same patient appears in train and test), and how small your test set can get before the estimate is too noisy to act on.`,
      },
      {
        title: 'Beyond accuracy: precision, recall, and the cost of being wrong',
        type: 'READING',
        durationMins: 40,
        body: `A fraud detection model achieves 99.9% accuracy. Should you deploy it?

Not yet. If 0.1% of transactions are fraudulent, then the model that predicts "not fraud" for everything, always, scores 99.9% too. Accuracy on imbalanced data tells you about the class balance, not about the model.

## The confusion matrix

Everything useful comes from four counts. For a binary classifier:

|                    | Actually positive | Actually negative |
|--------------------|-------------------|-------------------|
| **Predicted positive** | True positive (TP)  | False positive (FP) |
| **Predicted negative** | False negative (FN) | True negative (TN)  |

Look at the matrix before any summary statistic. A single number has already thrown away the distinction between the two ways of being wrong, and those two ways usually have wildly different costs.

## The metrics that matter

**Precision** = TP / (TP + FP). Of everything flagged, how much was real? Low precision means crying wolf.

**Recall** (sensitivity) = TP / (TP + FN). Of everything real, how much was caught? Low recall means missing cases.

These trade off. Flag more aggressively and recall rises while precision falls. The threshold from Unit 2 is the dial, and there is no setting that is correct in general — only settings appropriate to a cost structure.

- **Cancer screening**: a missed tumour is fatal; a false positive means an unpleasant follow-up test. Favour recall heavily.
- **Automated content removal**: a false positive silences someone who did nothing wrong. Favour precision.
- **Spam filtering**: a missed spam is a mild annoyance; a legitimate email in the spam folder can lose a contract. Favour precision, strongly.

**F1** is the harmonic mean of precision and recall: 2PR/(P+R). It is a reasonable default when you have no cost information and a poor one when you do — it asserts precision and recall matter equally, which is a strong claim usually made by accident.

## ROC, AUC, and their limits

The **ROC curve** plots true positive rate against false positive rate across every threshold. **AUC** is the area beneath it, interpretable as: the probability that a randomly chosen positive is ranked above a randomly chosen negative. It is threshold-independent, which makes it good for comparing models before you have chosen an operating point.

Its weakness appears under heavy imbalance. False positive rate has the large negative count in its denominator, so thousands of false positives barely move it. A model can post an impressive AUC of 0.95 and still be useless, because at any threshold catching a reasonable share of positives it drowns you in false alarms.

For imbalanced problems, use the **precision–recall curve** instead. It ignores true negatives entirely, and true negatives are the class you have too many of.

## Calibration, which almost nobody checks

A model is **calibrated** if, among cases it assigns probability 0.7, roughly 70% really are positive.

Discrimination and calibration are different properties. A model that ranks perfectly but outputs everything between 0.4 and 0.6 has excellent AUC and useless probabilities. If a human or a downstream system consumes those numbers as probabilities — expected loss, triage thresholds, anything with an expected-value calculation — miscalibration silently corrupts every decision.

Check it with a **reliability diagram**: bin predictions, plot mean predicted against observed frequency, and look for the diagonal. Boosted trees are typically overconfident; Platt scaling or isotonic regression on a held-out set will fix it.`,
      },
      {
        title: 'Cross-validation, and the leakage that invalidates it',
        type: 'READING',
        durationMins: 35,
        body: `A single train/test split gives one number with unknown uncertainty. Split differently and you might get four points more or less. On small datasets, that variance can exceed the differences you are trying to detect.

## k-fold cross-validation

Divide the data into k equal folds. Train on k−1, evaluate on the held-out one, rotate, repeat k times. Every observation is used for evaluation exactly once.

You get k estimates, so you get a **mean and a spread**. The spread is the point. "84.2% ± 0.6" and "84.2% ± 7.1" are entirely different claims, and only one supports a decision.

k = 5 or k = 10 are conventional. Larger k means more training data per fold (less pessimistic bias) and more computation. The extreme, k = n, is leave-one-out: nearly unbiased, high variance, and usually not worth the cost.

**Stratified** k-fold preserves class proportions in each fold. On imbalanced data this is not optional — random folds can produce a fold containing no positives at all, and the metric for that fold is then undefined or absurd.

## Leakage: the failure that flatters you

**Data leakage** is when information unavailable at prediction time reaches the model during training. It is the most damaging error in applied machine learning precisely because it does not look like an error. Your metrics improve. Everyone is pleased. The model fails in production and nobody knows why.

### Preprocessing before splitting

The classic. You standardise the whole dataset, *then* split. The mean and standard deviation used on the training data were computed using the test data. Test information has leaked.

The effect is usually small, but the same mistake with imputation, target encoding, or feature selection is catastrophic. Select the top 100 features by correlation with the target across the full dataset and your test estimate is worthless — the features were chosen partly because they work on the test set.

**The rule: every transformation fitted on data must be fitted inside the training fold and applied to the held-out fold.** A pipeline object enforces this. Doing it by hand does not.

### Temporal leakage

Random splitting of time-ordered data lets the model train on Thursday and predict Wednesday. Real deployment never affords that. Split by time, always, when time exists.

### Group leakage

The same patient contributes ten scans; random splitting puts some in train and some in test. The model recognises the patient, not the pathology. Split by group.

### Target leakage in the features

The subtlest kind. A feature contains information derived from the outcome. \`number_of_reminder_emails_sent\` predicts loan default beautifully — because reminders are sent *after* someone starts missing payments. At prediction time it is zero for everyone.

**The test:** for each feature, ask whether its value would genuinely be known at the moment the prediction must be made. Ask it of every feature. This tedious exercise catches more problems than any amount of model tuning.

## The tell

A model that performs implausibly well is not good news; it is a hypothesis about a bug. Near-perfect AUC on a genuinely hard problem means leakage until proven otherwise. Cultivate suspicion of your own good results — it is the cheapest quality control available.`,
      },
      {
        title: 'Laboratory: breaking your own model on purpose',
        type: 'LAB',
        durationMins: 90,
        body: `**Objective.** Introduce leakage deliberately, measure how good it makes you look, then remove it. The gap is the lesson.

**Data.** \`unit3/loans.csv\` — 8,000 applications, 22 features, binary default outcome, roughly 7% positive.

**Tasks**

1. Establish an honest baseline: pipeline with scaling inside the folds, stratified 5-fold, logistic regression. Report mean AUC and standard deviation.
2. Now leak. Standardise the entire dataset *before* splitting and re-run. Report the change. It will be small — note the size.
3. Leak harder. Select the 10 features most correlated with the target using the full dataset, then cross-validate using only those. Report the AUC. Compare to step 1 and comment on whether you would have noticed this in a report.
4. Look at the feature list. At least one feature could not be known at application time. Identify it and justify your reasoning. Remove it and re-run step 1.
5. Compare precision–recall curves with ROC curves for your honest model. At 7% positives, which is more informative? Give the precision at the threshold achieving 60% recall.
6. Produce a reliability diagram. Is the model calibrated? If not, apply isotonic regression on a held-out set and plot both.

**Submission.** A table of the AUC figures from steps 1–4, the two curve figures, the reliability diagram, and a short paragraph on step 4.

**Warning.** Step 3 typically produces an AUC around 0.95 against an honest baseline near 0.72. If you had not deliberately caused it, you would be celebrating.`,
      },
    ],
  },
  {
    title: 'Unit 4: Overfitting and regularisation',
    summary:
      'Why a model that fits perfectly is broken, what bias and variance actually decompose into, and the handful of techniques that trade one for the other.',
    lessons: [
      {
        title: 'Why a model that fits perfectly is broken',
        type: 'VIDEO',
        durationMins: 24,
        body: `A polynomial of degree 59 can pass exactly through 60 data points. Training error: zero. It is also useless, and this lecture is about why that is not a paradox.

Between the points, the curve swings wildly — hundreds of units above and below anything observed. It has not learned the relationship. It has learned *these sixty points*, including whatever noise they carry, and noise does not repeat.

**The intuition to take away:** a model has finite capacity to represent structure. If the structure in the data runs out before the capacity does, the remaining capacity is spent on noise. More capacity than signal is not neutral — it is actively harmful.

**Demonstrated in the lecture:** the same 60 points fitted at degrees 1, 3, 9 and 59, with training and test error plotted against degree. Training error falls monotonically. Test error falls, reaches a minimum around degree 3, then climbs steeply. That U-shape is the single most important picture in the course.

**A caveat, stated honestly.** Very large modern networks sometimes show test error falling again beyond the interpolation point — "double descent". It is real, it is an active research area, and it does not rescue a degree-59 polynomial on 60 points. Treat the U-shape as the working model for everything in this course.`,
      },
      {
        title: 'Bias and variance, worked by hand',
        type: 'READING',
        durationMins: 40,
        body: `"Bias–variance trade-off" gets repeated more often than it gets understood. This reading does the decomposition on twelve points so you can see where each term comes from.

## The decomposition

Consider a single input x₀. Your training set is random — a different sample would give a different model, hence a different prediction at x₀. Over that randomness, expected squared error decomposes exactly:

    E[(y − f̂(x₀))²] = Bias[f̂(x₀)]² + Var[f̂(x₀)] + σ²

- **Bias** — how far the *average* prediction over many training sets sits from the truth. Systematic error. A straight line fitted to a curve is biased everywhere, no matter how much data you give it.
- **Variance** — how much the prediction moves as the training set changes. A degree-59 polynomial refitted on a fresh sample produces a wildly different curve.
- **σ²** — irreducible noise. If the outcome genuinely contains randomness, no model removes it. Any claim to have driven error below σ² is a claim to have leaked.

## The experiment, on twelve points

The workspace notebook does this; the arithmetic is small enough to follow.

Generate data from y = sin(x) + ε, twelve points, noise σ = 0.2. Draw **200 independent training sets**. Fit three models to each: a constant, a cubic, and a degree-11 polynomial. Then at x₀ = 2.0, look at the spread of the 200 predictions.

| Model | Mean prediction | Bias² | Variance | Total |
| --- | --- | --- | --- | --- |
| Constant | 0.04 | 0.83 | 0.01 | 0.88 |
| Cubic | 0.89 | 0.01 | 0.05 | 0.10 |
| Degree 11 | 0.92 | 0.00 | 1.740 | 1.74 |

Read the columns. The constant is badly biased and barely moves — it is wrong the same way every time. The degree-11 polynomial is *unbiased on average* and useless, because any single one of its 200 fits is far from that average. The cubic is close to the truth and stable.

**This is the whole idea.** "Unbiased" is not the goal. Low total error is the goal, and accepting a little bias to remove a lot of variance is usually a good trade.

## Which one do you have?

Diagnose from **learning curves** — training and validation error plotted against training set size.

- **High bias**: both curves plateau, close together, at a disappointing level. More data will not help. You need a richer model or better features.
- **High variance**: a large gap between low training error and high validation error, with the gap narrowing as data grows. More data *will* help, and so will regularisation.

Plotting learning curves takes ten minutes and tells you which lever to pull. Skipping this step is why teams spend months collecting data for a high-bias model that could never use it.`,
      },
      {
        title: 'L1 and L2: what each actually penalises',
        type: 'READING',
        durationMins: 35,
        body: `Regularisation adds a penalty on the size of the coefficients, so the optimiser must trade fit against complexity. Two penalties dominate, and they behave quite differently.

## Ridge (L2)

    L = Σ(ŷ − y)² + λ Σβⱼ²

The penalty is the sum of *squared* coefficients. λ controls the strength: λ = 0 is ordinary least squares, and large λ drives everything toward zero.

Because the derivative of βⱼ² is 2βⱼ, the pull toward zero is **proportional to the coefficient's current size**. Large coefficients are pushed hard; small ones are barely touched. So coefficients shrink, approach zero asymptotically, and never quite arrive.

Ridge is the right default when you believe many features contribute a little. It also solves the ill-conditioning from Unit 2 directly: adding λ to the diagonal of XᵀX makes it invertible again, which is why those ±4,000 coefficients collapse to something sensible the moment any ridge penalty is applied.

## Lasso (L1)

    L = Σ(ŷ − y)² + λ Σ|βⱼ|

The penalty is the sum of *absolute values*. The derivative of |βⱼ| is ±1 — **constant, regardless of size**. Every coefficient gets the same push toward zero, so small ones are driven exactly to zero and stay there.

Lasso therefore performs feature selection as a side effect of fitting. With λ tuned, you may find 300 of 1,000 coefficients exactly zero, and the model is genuinely simpler, not merely shrunk.

The geometric explanation, if it helps: the L1 constraint region is a diamond with corners on the axes; the L2 region is a circle. The first contact between the loss contours and a diamond tends to happen at a corner — and a corner means a coordinate is zero. A circle has no corners.

## Choosing

- **Many weak contributors** → ridge.
- **A few strong ones hidden among many irrelevant** → lasso.
- **Correlated groups** → lasso picks one arbitrarily and zeroes the rest, which is unstable across resamples. **Elastic net** mixes both penalties and keeps correlated groups together.
- **Genuinely unsure** → elastic net with the mix as a hyperparameter, chosen on validation data.

## Two things that catch people out

**Scale first.** The penalty is on coefficient magnitude, and a coefficient's magnitude depends on its feature's units. A feature in metres and the same feature in kilometres attract penalties differing by a factor of a thousand. Regularising unscaled features penalises them essentially at random. **Always standardise before regularising.**

**Do not penalise the intercept.** It represents the baseline level of the target, not a relationship to any feature. Shrinking it toward zero just biases every prediction downward. Sensible libraries exclude it; verify that yours does.

## Regularisation without a penalty term

**Early stopping**: monitor validation loss and stop when it starts rising. Cheap and effective; the model has less opportunity to memorise.

**Dropout** (networks): randomly zero a fraction of units each step, so no unit can rely on any specific other. An ensemble effect at almost no cost.

**Data augmentation**: expand the training set with label-preserving transformations. A rotated cat is still a cat. Often the single most effective regulariser available, because it attacks the problem at its source — not enough data.`,
      },
      {
        title: 'Laboratory: the regularisation path',
        type: 'LAB',
        durationMins: 90,
        body: `**Objective.** Watch coefficients shrink as λ rises, and see for yourself where L1 and L2 differ.

**Data.** \`unit4/genes.csv\` — 200 samples, 900 features, binary outcome. Far more features than samples, which is where regularisation stops being optional.

**Tasks**

1. Fit unregularised logistic regression. Report training and cross-validated performance. The gap will be enormous; state both numbers.
2. Fit ridge across λ ∈ {0.001, 0.01, 0.1, 1, 10, 100}. Plot cross-validated AUC against log λ, and plot the coefficient paths — all 900 coefficients against log λ on one figure.
3. Repeat with lasso. On the same axes if you can.
4. For each λ in the lasso run, count coefficients exactly zero. Plot that count against log λ. At your best-performing λ, how many features survive?
5. Compare the ridge and lasso coefficient path figures and describe the difference in two sentences. It should be visible at a glance.
6. Take the features lasso selected at the best λ, refit an *unregularised* model on only those, and cross-validate. Compare with step 3. Explain any difference — and consider whether this procedure is entirely honest. (It is not quite. Say why.)
7. Fit elastic net over a grid of λ and mixing ratio. Does it beat either alone?

**Submission.** The four figures, the feature counts, and your answers to 5 and 6.

**Note on step 6.** Selecting features on the full dataset and then evaluating by cross-validation reuses those folds for both selection and assessment. Unit 3 covers exactly this. Nested cross-validation is the correct treatment — say so in your answer even if you do not implement it.`,
      },
    ],
  },
  {
    title: 'Unit 5: Trees, ensembles, and the tabular workhorses',
    summary:
      'Decision trees and why one is rarely enough, then bagging and boosting — the methods that still win on tabular data, and what they cost you in interpretability.',
    lessons: [
      {
        title: 'Decision trees: splitting on impurity',
        type: 'VIDEO',
        durationMins: 25,
        body: `A decision tree asks a sequence of yes/no questions about the features and reads a prediction off the leaf you land in. Fitting one means choosing the questions.

**The greedy algorithm.** At each node, consider every feature and every possible split point. Score each by how much it reduces impurity. Take the best. Recurse on both children. Stop on a criterion — maximum depth, minimum samples per leaf, or no split improving things.

**Impurity measures.** Gini, 1 − Σpᵢ², and entropy, −Σpᵢ log pᵢ. Both are zero when a node is pure and maximal when classes are evenly mixed. They rarely disagree about which split is best; Gini is marginally cheaper and is the usual default.

**What trees are good at:**

- Non-linear boundaries, without you specifying the form
- Feature interactions, discovered rather than hand-crafted
- Mixed data types, with no scaling required
- Missing values, handled natively by several implementations

**What they are bad at:**

- **Instability.** Change a handful of training rows and the top split can change, which changes everything beneath it. High variance in the Unit 4 sense.
- **Axis-aligned splits.** A diagonal boundary must be approximated with a staircase, which takes many splits to do badly.
- **Overfitting**, enthusiastically, if grown without constraint. An unpruned tree can memorise the training set completely.

That instability is a defect on its own and an *asset* when you build ensembles from it — which is the next lesson.`,
      },
      {
        title: 'Bagging, random forests, and why averaging works',
        type: 'READING',
        durationMins: 35,
        body: `A single deep tree has low bias and high variance. Unit 4 gave the remedy: reduce variance while keeping bias low. Averaging does exactly that.

## Bagging

**B**ootstrap **agg**regat**ing**. Draw a bootstrap sample — n rows sampled *with replacement* — fit a tree, repeat 200 times, average the predictions.

If the models were independent, averaging B of them would cut variance by a factor of B. They are not independent — they share most of their data — so the reduction is smaller. It is still substantial, and bias is essentially unchanged, since each tree is fitted the same way.

The counter-intuitive part: bagging makes an unstable learner useful *because* it is unstable. Averaging 200 near-identical models achieves nothing. It is the disagreement that creates the benefit.

## Random forests: decorrelating further

If disagreement between trees is what helps, force more of it. At **each split**, a random forest considers only a random subset of features — typically √p for classification.

This seems perverse; you are hiding the best feature from many splits. But suppose one feature is strongly predictive. Every bagged tree splits on it first, and the trees end up highly correlated, limiting the benefit of averaging. Restricting the candidate features gives other features a chance to appear near the root, and the trees genuinely differ.

**Out-of-bag estimation** is a small gift. Each bootstrap sample omits about 37% of rows (the limit of (1 − 1/n)ⁿ). Every row can therefore be predicted by the trees that never saw it, giving a cross-validation-like estimate for free.

**Hyperparameters worth knowing:** number of trees (more never hurts accuracy, only time — no need to tune, just use enough); features per split (worth tuning); minimum samples per leaf (the main control on individual tree depth).

## Boosting: a different idea entirely

Bagging fits many models **in parallel** on different samples and averages. Boosting fits models **in sequence**, each trying to correct its predecessors' errors.

Gradient boosting, specifically: fit a shallow tree, compute the residuals, fit the next tree to *those residuals*, add it to the ensemble scaled by a learning rate, and repeat. The ensemble is a sum of many weak corrections rather than an average of strong models.

**Consequences of the difference:**

- Boosting typically reaches lower error than random forests on tabular data. It remains the method to beat there — neural networks have not displaced it on ordinary tables.
- Boosting **can** overfit with too many rounds. Random forests essentially cannot with more trees. Boosting therefore needs early stopping on a validation set; the forest does not.
- Boosting is sequential, so it parallelises poorly across rounds. Forests are embarrassingly parallel.
- Boosting is more sensitive to hyperparameters — learning rate and number of rounds trade against each other directly. Lower rate, more rounds, better results, longer wait.

## Practical advice

Start with a random forest. It is nearly parameter-free, hard to misuse, and gives a strong baseline in one line. Then try gradient boosting (XGBoost, LightGBM or CatBoost) with early stopping; expect a modest but real improvement for meaningfully more tuning.

If neither beats regularised logistic regression by much, that is genuine information about your problem. Report it rather than hiding it.`,
      },
      {
        title: 'Feature importance, and how it misleads',
        type: 'READING',
        durationMins: 30,
        body: `Tree ensembles report feature importances, they are widely quoted in reports, and the default ones are unreliable in ways that are worth knowing before you present them to anyone.

## Impurity-based importance (the default)

Sum the impurity reduction from every split on each feature, weighted by samples reaching that node. Free to compute, since it falls out of training.

It has **two serious biases**:

**High-cardinality features are inflated.** A feature with many distinct values offers many possible split points, so more chances to find one that helps by luck. A random ID column can rank near the top. This is not subtle — it happens on real data constantly.

**Correlated features split the credit arbitrarily.** Two nearly identical features each receive roughly half the importance of either alone. A genuinely important signal, represented twice, can appear to be two moderate contributors and be dismissed.

## Permutation importance

Fit the model. Measure performance. Shuffle one feature's values, measure again. The drop is that feature's importance.

Better, because it measures effect on *predictive performance* rather than internal bookkeeping, and it works for any model. Two cautions: compute it on **held-out** data, not training data, or you measure memorisation; and correlated features still mislead, because shuffling one leaves its partner supplying the information, so both look unimportant.

## SHAP values

Attribute each individual prediction among its features, with a game-theoretic grounding and consistency guarantees the others lack. Also gives per-prediction explanations, not just global rankings — often what a stakeholder actually wants ("why was *my* application declined?").

Costlier, and the tree-specific implementations are fast enough for practical use. The main risk is over-reading them: SHAP explains what the *model* does, not what the *world* does.

## The point that matters most

**None of these establish causation.** A feature can be highly important because it is a proxy for something else, because of leakage, or because of a spurious correlation in your sample.

Ice cream sales are important for predicting drowning deaths. Banning ice cream will not save anyone. If someone is about to make a decision to *change* a feature on the basis of its importance, that is a causal question, and predictive importance does not answer it.

Saying this clearly in a report is worth more than any refinement of the ranking method.`,
      },
      {
        title: 'Laboratory: forests, boosting, and an honest comparison',
        type: 'LAB',
        durationMins: 120,
        body: `**Objective.** Compare four model families on equal terms, and get the comparison methodologically right — which is harder than fitting any of them.

**Data.** \`unit5/insurance.csv\` — 15,000 policies, 31 mixed-type features, binary claim outcome, about 12% positive.

**Tasks**

1. Set up nested cross-validation: an inner loop for hyperparameters, an outer loop for the performance estimate. Every model in this laboratory uses the same outer folds.
2. Fit and tune: regularised logistic regression; a single decision tree; a random forest; gradient boosting with early stopping.
3. Report outer-fold mean and standard deviation for each. Present as a table. Given the standard deviations, state which differences you would actually defend.
4. Plot impurity-based and permutation importance for the random forest side by side. Identify a feature where they disagree substantially and explain why.
5. Add a column of random noise as a feature and refit. Where does it rank on each importance measure? (This is a useful sanity check to keep in your toolkit.)
6. Compute SHAP values for the boosted model. Take the three highest-risk policies and write a one-sentence explanation of each, in language a non-technical claims handler could act on.
7. Compare training time. Include it in your recommendation — a two-hour fit for half a point of AUC is a real trade-off, not a free win.

**Submission.** The results table, the two importance figures, your three SHAP explanations, and a final paragraph recommending one model with reasoning.

**Marks are for step 3 and the final paragraph.** Anyone can call four fit methods. Knowing which differences survive the variance, and saying so plainly, is the skill.`,
      },
    ],
  },
  {
    title: 'Unit 6: Unsupervised learning, and what happens after deployment',
    summary:
      'Clustering and dimensionality reduction without ground truth to check against, then the part most courses omit: what a model does over the months after it ships.',
    lessons: [
      {
        title: 'k-means, and the clusters that are not there',
        type: 'VIDEO',
        durationMins: 23,
        body: `k-means is the first clustering algorithm everyone learns and the one most often misapplied.

**The algorithm.** Choose k. Place k centroids. Repeat until stable: assign each point to its nearest centroid; move each centroid to the mean of its assigned points. It converges quickly and is easy to implement.

**What it assumes**, usually without anyone noticing:

- Clusters are roughly **spherical**. It uses Euclidean distance, so elongated or crescent-shaped clusters are split incorrectly.
- Clusters are of similar **size and density**. A large sparse cluster next to a small dense one gets carved up.
- **k is known.** It is not, and that is the whole problem.
- **Scale matters.** Unscaled features mean whichever has the largest numeric range dominates the distance. Standardise first, always.

**The failure to remember.** k-means always returns k clusters. Give it uniform random noise and ask for five, and you get five, complete with centroids and neat assignments. It cannot tell you there is no cluster structure, because nothing in it is capable of asking.

**Choosing k:** the elbow method on within-cluster sum of squares (subjective, and often there is no elbow); silhouette score (better, and comparable across k); gap statistic (compares against a null of no structure, which is the right question). The lecture demonstrates all three on data with genuine structure and on noise, so you can see what each says when the honest answer is "there are no clusters".`,
      },
      {
        title: 'PCA: fewer dimensions, and what you give up',
        type: 'READING',
        durationMins: 35,
        body: `Principal component analysis finds the directions along which your data varies most and lets you keep only the first few.

## What it does

Centre the data. Find the direction of maximum variance — the first principal component. Find the direction of maximum remaining variance orthogonal to it — the second. Continue. Keep the first k, project onto them, and you have k dimensions rather than p.

Mechanically it is the eigendecomposition of the covariance matrix (or an SVD of the centred data, which is what implementations actually do because it is more numerically stable).

## Why bother

- **Visualisation.** Two or three components can be plotted; forty features cannot.
- **Noise reduction.** Low-variance directions are often mostly noise; dropping them can improve downstream models.
- **Decorrelation.** Components are orthogonal by construction, which helps methods that suffer from collinearity.
- **Speed.** Fewer dimensions, faster fitting.

## What you give up

**Interpretability, immediately.** A principal component is a weighted combination of every original feature. "PC1 = 0.31·age − 0.22·income + 0.19·tenure + …" is not something you explain to a stakeholder, and any model built on components inherits that opacity.

**Any guarantee that variance means relevance.** This is the one that bites. PCA is entirely unsupervised — it never sees your target. The direction of greatest variance may be irrelevant to what you are predicting, and a low-variance direction may carry the signal. Discarding components can throw away exactly the thing you needed.

If your goal is supervised prediction, PCA is not automatically a good preprocessing step. Test it against not doing it. Partial least squares, which does use the target, is often the better tool.

**Scale sensitivity.** Variance depends on units. A feature in millimetres has a thousand times the variance of the same feature in metres and will dominate the first component. Standardise unless the features are already in comparable units and you have a reason to preserve their relative scales.

## How many components

Plot cumulative explained variance and pick where it flattens — the same subjective elbow as k-means, with the same weakness.

If you are feeding a supervised model, the honest approach is to treat the component count as a hyperparameter and choose it by cross-validation, on the criterion you actually care about.

## Related tools worth knowing

**t-SNE and UMAP** produce far better two-dimensional pictures for visualisation. Two warnings that are routinely ignored: distances *between* clusters in a t-SNE plot are not meaningful, and both are sensitive to their hyperparameters — different perplexity settings give different pictures of the same data. They are tools for generating hypotheses, not for demonstrating conclusions.`,
      },
      {
        title: 'After deployment: drift, feedback loops, and monitoring',
        type: 'READING',
        durationMins: 35,
        body: `Most courses stop at the test set. Most of a model's life happens afterwards, and this is where the i.i.d. assumption from Unit 1 finally comes due.

## The ways a live model degrades

**Covariate shift** — the input distribution moves; the relationship holds. Your customer base shifts younger. P(X) changes, P(y|X) does not. Often survivable, and detectable by monitoring feature distributions.

**Concept drift** — the relationship itself changes. What predicted default before a recession does not predict it during one. P(y|X) changes. This is the serious one, and you cannot detect it from inputs alone — you need outcomes.

**Label delay** — you often learn the truth months later. A 12-month default label means today's model is evaluated on a year-old vintage. During the delay you are flying on proxies.

**Feedback loops** — the model changes the world it predicts. A fraud model blocks transactions, so you never learn whether they were fraudulent, so retraining sees a censored sample. A loan model declines applicants, so future training data contains only people the previous model approved. **Left alone, this narrows the model's world until it is confidently wrong about everyone it never sees.**

## What to monitor

In rough order of how quickly it tells you something:

1. **Prediction distribution.** Cheap, immediate, no labels needed. If the share of positives doubles overnight, something changed — possibly upstream data, possibly the world.
2. **Input distributions,** per feature. Population stability index or a Kolmogorov–Smirnov test against the training distribution. Catches covariate shift and, more often, broken data pipelines.
3. **Data quality.** Null rates, unexpected categories, values out of range. A surprising fraction of "model degradation" is a renamed upstream column.
4. **Performance,** once labels arrive. The real thing, and always the most delayed.
5. **Performance by segment.** Aggregate metrics hide a model that has quietly stopped working for one group. Break results down by the segments you would be embarrassed to fail.

## Practices worth adopting

**Keep a holdout that is never trained on**, refreshed over time, so you always have an uncontaminated estimate.

**Randomise a small fraction of decisions** — approve a few applications the model would decline. Expensive and it is the only way to break a feedback loop and learn what happens on the other side of your own threshold. Treat it as the cost of knowing.

**Version everything**: data, features, model, code. When performance changes you need to know what changed, and "we retrained on Tuesday" is not an answer without a diff.

**Decide the retraining trigger in advance.** On a schedule, or on a monitored threshold. Deciding after a bad week means deciding under pressure with no baseline.

## The disposition to take away

A deployed model is not a finished artefact. It is a component interacting with a world that responds to it. The evaluation you did before launch was a snapshot, and its shelf life is finite and usually unknown.

The engineers who handle this well are not the ones with the best models. They are the ones who assumed from the outset that the model would degrade, and built the instrumentation to notice.`,
      },
      {
        title: 'Laboratory: clustering without ground truth, and detecting drift',
        type: 'LAB',
        durationMins: 100,
        body: `**Objective.** Two exercises: cluster data where you cannot check the answer, and detect drift in a stream where you are not told when it happens.

**Part A — clustering (\`unit6/customers.csv\`, 4,000 rows, 9 features)**

1. Standardise. Run k-means for k = 2…10. Plot inertia and silhouette against k.
2. Choose k and justify it. Use more than one criterion and say what you would do if they disagreed.
3. Run the gap statistic against a uniform null. Does it support the existence of cluster structure at all? Report honestly if it does not.
4. Profile your clusters: mean of each original feature per cluster. Give each a plain-English name a marketing team could use.
5. Now the control. Generate a dataset of the same shape from uniform noise, run the identical pipeline, and profile those clusters too. Write two sentences comparing the profiles you produced in step 4 with the ones you just produced from noise. This is the most valuable step in the laboratory.
6. Run DBSCAN. How do the results differ, and which assumption explains the difference?

**Part B — drift (\`unit6/stream.csv\`, 40,000 rows, timestamped)**

7. Train on the first 10,000 rows. Evaluate on successive 5,000-row windows. Plot AUC over time.
8. For each window, compute population stability index for every feature against the training distribution. Plot alongside the AUC curve.
9. There is at least one drift event. Identify approximately when, and say whether it is covariate shift or concept drift — justify from the evidence, not from the shape of the AUC curve alone.
10. Propose a monitoring rule that would have raised an alert before performance degraded materially. State its false alarm rate on this data.

**Submission.** Both sets of figures, your cluster profiles alongside the noise profiles, and your answers to 5, 9 and 10.

**Note.** If step 5 makes you uncomfortable about step 4, that is the intended outcome and you should say so in your write-up. Clustering produces output on any input; the discipline is in deciding whether the output means anything.`,
      },
    ],
  },
];

export const AI301_MACHINE_LEARNING: AuthoredCourse = {
  code: 'AI301',
  modules,
  quiz: {
    title: 'AI301 Units 1–3 quiz',
    description:
      'Twelve questions on framing, fitting and evaluation. Two attempts, best mark counts. Every question carries an explanation — read them, including for the ones you got right.',
    durationMins: 30,
    questionsToServe: 8,
    questions: [
      {
        prompt: 'A model fits the training data almost perfectly and performs poorly on held-out data. What is the most likely diagnosis?',
        options: [
          'The hypothesis space is too small',
          'The hypothesis space is large enough to memorise the training set',
          'The learning rate is too low',
          'The features need scaling',
        ],
        correct: 1,
        explanation:
          'Fitting training data well rules out underfitting. Memorisation that does not generalise is overfitting, addressed by regularisation, more data, or a smaller model — not by training longer.',
      },
      {
        prompt: 'Why is the factor of ½ conventionally placed in front of the squared error loss?',
        options: [
          'It halves the learning rate',
          'It makes the loss comparable across datasets of different size',
          'It cancels the 2 produced by differentiating the square, giving a cleaner gradient',
          'It prevents the loss becoming negative',
        ],
        correct: 2,
        explanation:
          'Purely cosmetic. d/dx of x² is 2x, so the ½ cancels it. Scaling a loss by a constant does not change where its minimum lies.',
      },
      {
        prompt: 'Your loss becomes NaN after about twenty gradient descent steps. What is the first thing to check?',
        options: [
          'That the learning rate is not too high',
          'That there is enough training data',
          'That the model has enough parameters',
          'That the test set is representative',
        ],
        correct: 0,
        explanation:
          'Divergence to NaN within a few dozen steps is overwhelmingly a learning rate that overshoots, each step landing further up the opposite side. Reduce it by a factor of ten and re-plot.',
      },
      {
        prompt: 'Standardising features to zero mean and unit variance mainly helps because…',
        options: [
          'It removes outliers from the data',
          'It makes the loss surface less elongated, so one learning rate suits every direction',
          'It guarantees the model will not overfit',
          'It is required for the normal equation to have a solution',
        ],
        correct: 1,
        explanation:
          'Features on wildly different scales create a long narrow valley. A single learning rate must then be small enough for the steepest direction, making progress along the shallow one extremely slow.',
      },
      {
        prompt: 'Squared error is a poor loss for classification principally because…',
        options: [
          'It cannot be differentiated',
          'It is slower to compute than log loss',
          'Its penalty for being confidently wrong is bounded, whereas log loss grows without limit',
          'It only works for continuous features',
        ],
        correct: 2,
        explanation:
          'If the truth is 1 and you predict 0.01, squared error charges about 0.98. Log loss charges −log(0.01) ≈ 4.6, and approaches infinity as the prediction approaches 0. Confident and wrong should be arbitrarily expensive.',
      },
      {
        prompt: 'A fraud model reports 99.9% accuracy on data where 0.1% of transactions are fraudulent. What can you conclude?',
        options: [
          'The model is excellent',
          'Almost nothing — predicting "never fraud" achieves the same score',
          'The model is overfitting',
          'The test set is too small',
        ],
        correct: 1,
        explanation:
          'Under heavy imbalance, accuracy measures the class balance. Look at the confusion matrix, then precision and recall, and prefer the precision–recall curve to ROC.',
      },
      {
        prompt: 'Which situation most argues for optimising recall at the expense of precision?',
        options: [
          'Filtering spam from a work inbox',
          'Automatically removing user posts for policy violations',
          'Screening for an aggressive cancer, where follow-up is a further test',
          'Deciding which customers receive a discount code',
        ],
        correct: 2,
        explanation:
          'The costs are asymmetric: a missed tumour may be fatal, a false positive costs an additional test. The other three all carry a substantial cost for false positives.',
      },
      {
        prompt: 'AUC can be misleading on heavily imbalanced data because…',
        options: [
          'It cannot be computed when classes are imbalanced',
          'False positive rate has the large negative count in its denominator, so many false positives barely move it',
          'It requires a fixed threshold to be chosen first',
          'It is only valid for linear models',
        ],
        correct: 1,
        explanation:
          'With 999,000 negatives, a thousand false positives shift FPR by 0.001. The precision–recall curve ignores true negatives and exposes the problem.',
      },
      {
        prompt: 'A model has excellent AUC but its predicted probabilities cluster between 0.4 and 0.6. What is wrong?',
        options: [
          'Nothing — AUC is what matters',
          'It is overfitting',
          'It discriminates well but is poorly calibrated, so the probabilities cannot be used in expected-value calculations',
          'The learning rate was too high',
        ],
        correct: 2,
        explanation:
          'Ranking and calibration are distinct. Ranking is fine here; the numbers are not usable as probabilities. Check with a reliability diagram and correct with Platt scaling or isotonic regression.',
      },
      {
        prompt: 'Which of these is the most damaging form of data leakage?',
        options: [
          'Standardising the full dataset before splitting',
          'Using k = 5 rather than k = 10 folds',
          'A feature whose value is only ever recorded after the outcome has occurred',
          'Shuffling the data before splitting',
        ],
        correct: 2,
        explanation:
          'Target leakage in a feature can produce near-perfect validation scores and a model that is worthless in deployment, because at prediction time the feature is absent or empty. Scaling before splitting leaks too, but far less.',
      },
      {
        prompt: 'Data is ordered in time. How should it be split for evaluation?',
        options: [
          'Randomly, so each split is unbiased',
          'By time, training on earlier data and evaluating on later',
          'Alternating rows between train and test',
          'It makes no difference provided the test set is large enough',
        ],
        correct: 1,
        explanation:
          'Random splitting lets the model train on the future and predict the past — an advantage no deployment ever has. Split by time so evaluation matches the real task.',
      },
      {
        prompt: 'Why must the test set be used only once?',
        options: [
          'Repeated use is computationally expensive',
          'The library caches results after the first evaluation',
          'Each look and adjust leaks information, turning it into a second validation set and destroying the honest estimate',
          'Its labels are deleted after the first use',
        ],
        correct: 2,
        explanation:
          'Adjusting the model after seeing test performance fits it to the test set. The only remedy is fresh data, which is why the validation set exists to absorb the iteration.',
      },
    ],
  },
  assignments: [
    {
      title: 'Portfolio task: a defensible baseline',
      instructions: `Build and document an honest baseline on the dataset provided in the course workspace (\`portfolio/telecom-churn.csv\`).

**What to produce**

1. A framing section: state precisely what you are predicting, over what horizon, and why that target is the right one for the stated business question. Name one plausible alternative framing and say why you rejected it.
2. A leakage audit: go through every feature and state whether it would be known at prediction time. Present this as a table. Remove any that would not be, and say so.
3. A logistic regression baseline, cross-validated with all preprocessing inside the folds. Report mean and standard deviation of at least two metrics, and justify your metric choice against the cost of each error type.
4. A calibration check with a reliability diagram.
5. A statement of what you would need in order to improve on this baseline — data, features or method — in priority order.

Submit a single PDF (maximum eight pages including figures) plus your notebook.

**Marking rubric — 100 marks**

| Criterion | Marks | What earns full marks |
| --- | --- | --- |
| Problem framing | 20 | Target and horizon precisely specified; alternative framing considered and rejected with reasoning |
| Leakage audit | 25 | Every feature assessed; at least one genuine problem identified and correctly justified |
| Methodological soundness | 25 | Preprocessing inside folds; stratification where appropriate; no test-set contamination |
| Metric choice and interpretation | 20 | Metrics tied explicitly to error costs; variance reported and interpreted, not just the mean |
| Communication | 10 | Within page limit; figures labelled and referred to; conclusions follow from evidence shown |

A technically flawless model with an unjustified target will not pass this task. The framing is the assessed skill.`,
      maxScore: 100,
      weight: 0.15,
      allowLate: true,
    },
    {
      title: 'Applied case study: the model that got worse',
      instructions: `A deployed credit-risk model performed at AUC 0.81 in validation and has degraded to 0.62 over fourteen months in production. You have been given the training data, the deployment logs, and the monitoring dashboard (\`case-study/\` in the workspace).

In **1,500 words**, diagnose it.

**Your submission must:**

1. Propose at least three distinct hypotheses for the degradation, drawn from the material in Units 1–3. Covariate shift, feedback loops from the model's own decisions, and leakage that was present from the start are all plausible — you are not limited to these.
2. For each hypothesis, state the specific evidence in the supplied data that would confirm or rule it out, then go and look. Report what you found.
3. Reach a conclusion, and be explicit about your confidence in it.
4. Recommend both an immediate action and a monitoring change that would have caught this sooner.

**Marking rubric — 100 marks**

| Criterion | Marks | What earns full marks |
| --- | --- | --- |
| Hypotheses | 25 | Three or more genuinely distinct and plausible mechanisms, each stated precisely enough to be testable |
| Evidence | 30 | Each hypothesis tested against the actual data; negative results reported as carefully as positive ones |
| Conclusion | 20 | Follows from the evidence; uncertainty stated honestly rather than papered over |
| Recommendations | 15 | Immediate action is practical; monitoring change would genuinely have detected this earlier |
| Written quality | 10 | Within word count; a reader who was not in the room could act on it |

Diagnosing the right cause with weak evidence scores below diagnosing the wrong one with rigorous evidence that is honestly reported. Method is what is being assessed.`,
      maxScore: 100,
      weight: 0.15,
      allowLate: true,
    },
    {
      title: 'Final project: an end-to-end system with an honest evaluation',
      instructions: `Choose your own dataset and problem, subject to approval by week 6. Build a complete supervised learning system and report on it.

**Deliverables**

1. Working code, reproducible from a clean checkout, with a single command that reproduces every number in your report.
2. A **2,000-word report** covering: problem framing, data and its provenance, method and why you chose it, evaluation, limitations, and ethical considerations.
3. A ten-minute recorded walkthrough.

**Requirements**

- A baseline simpler than your final model, evaluated identically. If your sophisticated model does not beat it, say so — this is a finding, not a failure, and reporting it honestly scores better than hiding it.
- Cross-validated results with variance reported, not a single split.
- An explicit statement of who could be harmed if the model is wrong, and in which direction the errors fall.
- At least one thing you tried that did not work, and what you learned from it.

**Marking rubric — 100 marks**

| Criterion | Marks | What earns full marks |
| --- | --- | --- |
| Framing and data understanding | 15 | Target justified; provenance, collection and known biases of the data addressed |
| Technical execution | 20 | Reproducible; preprocessing correctly scoped; no leakage; sensible use of computation |
| Evaluation | 25 | Metrics matched to costs; variance reported; baseline compared on equal terms; calibration checked where relevant |
| Critical analysis | 25 | Limitations genuinely engaged with; failure modes identified; the negative result reported |
| Communication | 15 | Report within word count; walkthrough clear; figures earn their place |

**Weighting note.** Critical analysis carries the same marks as evaluation and more than technical execution. A modest model, understood thoroughly and reported honestly, outscores an impressive one presented uncritically. This reflects what the work is actually like.`,
      maxScore: 100,
      weight: 0.3,
      allowLate: false,
    },
  ],
};

/** Courses with authored content, keyed by course code. Everything else uses the template. */
export const AUTHORED_COURSES = new Map<string, AuthoredCourse>([
  [AI301_MACHINE_LEARNING.code, AI301_MACHINE_LEARNING],
]);
