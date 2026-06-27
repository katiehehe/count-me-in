import type { LessonStep, StepType } from '../../content/types'
import { FeedbackBox } from '../../components/FeedbackBox'
import { HintButton } from '../../components/HintButton'
import { ArrangementBoard } from '../simulation/ArrangementBoard'
import { ConnectionBoard } from '../simulation/ConnectionBoard'
import { CombinationTree } from '../simulation/CombinationTree'
import { DiceSimulation } from '../simulation/DiceSimulation'
import { FactorialDiscovery } from '../simulation/FactorialDiscovery'
import { OrderingsList } from '../simulation/OrderingsList'
import { ProbabilityGamble } from '../simulation/ProbabilityGamble'
import { OutcomeSelect } from '../simulation/OutcomeSelect'
import { CombinationCondense } from '../simulation/CombinationCondense'
import { CombinedExperiment } from '../simulation/CombinedExperiment'
import { DependencePairing } from '../simulation/DependencePairing'
import { ConditionalSelect } from '../simulation/ConditionalSelect'
import { ComplementSelect } from '../simulation/ComplementSelect'
import { CoinFlipSim } from '../simulation/CoinFlipSim'
import { ExpectedValueRoller } from '../simulation/ExpectedValueRoller'
import { ProductGrid } from '../simulation/ProductGrid'
import { MultisetCondense } from '../simulation/MultisetCondense'
import { MultipleChoiceStep } from './MultipleChoiceStep'
import { NumericQuestionStep } from './NumericQuestionStep'
import { FractionQuestionStep } from './FractionQuestionStep'
import { WorkedExampleStep } from './WorkedExampleStep'
import type { StepAiHelp } from './StepHelp'

export interface StepState {
  answered: boolean
  correct: boolean | null
  answer: string | number | null
  selectedIndex?: number | null
  /** Whether the learner's FIRST attempt at this step was correct (drives mastery). */
  firstTry?: boolean | null
  /** Sticky: true once the learner has selected the correct answer at least once. */
  everCorrect?: boolean
  explorationDone?: boolean
  factorialDone?: boolean
  connectionDone?: boolean
  treeDone?: boolean
  simulationDone?: boolean
  probabilityDone?: boolean
  outcomeSelectDone?: boolean
  condenseDone?: boolean
  combinedExpDone?: boolean
  pairingDone?: boolean
  evSimDone?: boolean
  productGridDone?: boolean
  multisetCondenseDone?: boolean
  workedExampleDone?: boolean
  conditionalSelectDone?: boolean
  complementSelectDone?: boolean
  coinSimDone?: boolean
  /** In-lesson AI help (hint or wrong-answer feedback) for graded questions. */
  aiHelp?: StepAiHelp | null
}

interface StepRendererProps {
  step: LessonStep
  stepState: StepState
  onStepUpdate: (update: Partial<StepState>) => void
  /** In-lesson AI help wiring (omitted when AI is off → static hints render). */
  aiBusy?: boolean
  onRequestHint?: () => void
  onRequestFeedback?: () => void
  onRevisit?: (stepId: string) => void
  reviewStepTitle?: string
}

export function StepRenderer({
  step,
  stepState,
  onStepUpdate,
  aiBusy,
  onRequestHint,
  onRequestFeedback,
  onRevisit,
  reviewStepTitle,
}: StepRendererProps) {
  switch (step.type) {
    case 'intro':
      return (
        <div>
          <p className="text-base leading-relaxed text-slate-700 sm:text-lg">{step.body}</p>
          {step.prompt && (
            <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-base font-semibold text-brand-800 sm:text-lg">
              {step.prompt}
            </p>
          )}
        </div>
      )

    case 'arrangement':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.arrangementConfig && (
            <ArrangementBoard
              items={step.arrangementConfig.items}
              targetCount={step.arrangementConfig.targetCount}
              goalCount={step.arrangementConfig.goalCount}
              keyByKind={step.arrangementConfig.keyByKind}
              onExploreComplete={() => onStepUpdate({ explorationDone: true })}
            />
          )}
          {!stepState.explorationDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.explorationDone && step.feedback?.correct && (
            <FeedbackBox variant="neutral" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'connection':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.connectionConfig && (
            <ConnectionBoard
              leftLabel={step.connectionConfig.leftLabel}
              rightLabel={step.connectionConfig.rightLabel}
              leftItems={step.connectionConfig.leftItems}
              rightItems={step.connectionConfig.rightItems}
              pairingLabel={step.connectionConfig.pairingLabel}
              onComplete={() => onStepUpdate({ connectionDone: true })}
            />
          )}
          {!stepState.connectionDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.connectionDone && step.feedback?.correct && (
            <FeedbackBox variant="correct" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'tree':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.treeConfig && (
            <CombinationTree
              stages={step.treeConfig.stages}
              pairingLabel={step.treeConfig.pairingLabel}
              onComplete={() => onStepUpdate({ treeDone: true })}
            />
          )}
          {!stepState.treeDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.treeDone && step.feedback?.correct && (
            <FeedbackBox variant="correct" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'simulation':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.simulationConfig && (
            <DiceSimulation
              faces={step.simulationConfig.faces}
              rolls={step.simulationConfig.rolls}
              editable={step.simulationConfig.editable}
              onComplete={() => onStepUpdate({ simulationDone: true })}
            />
          )}
          {!stepState.simulationDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.simulationDone && step.feedback?.correct && (
            <FeedbackBox variant="neutral" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'probability':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.probabilityConfig && (
            <ProbabilityGamble
              eventALabel={step.probabilityConfig.eventALabel}
              eventBLabel={step.probabilityConfig.eventBLabel}
              initialAPercent={step.probabilityConfig.initialAPercent}
              initialBPercent={step.probabilityConfig.initialBPercent}
              onComplete={() => onStepUpdate({ probabilityDone: true })}
            />
          )}
          {!stepState.probabilityDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.probabilityDone && step.feedback?.correct && (
            <FeedbackBox variant="neutral" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'outcome-select':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.outcomeSelectConfig && (
            <OutcomeSelect
              leftLabel={step.outcomeSelectConfig.leftLabel}
              rightLabel={step.outcomeSelectConfig.rightLabel}
              leftItems={step.outcomeSelectConfig.leftItems}
              rightItems={step.outcomeSelectConfig.rightItems}
              targetLeftId={step.outcomeSelectConfig.targetLeftId}
              targetRightId={step.outcomeSelectConfig.targetRightId}
              pairingLabel={step.outcomeSelectConfig.pairingLabel}
              onComplete={() => onStepUpdate({ outcomeSelectDone: true })}
            />
          )}
          {!stepState.outcomeSelectDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.outcomeSelectDone && step.feedback?.correct && (
            <FeedbackBox variant="correct" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'condensing':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.condensingConfig && (
            <CombinationCondense
              items={step.condensingConfig.items}
              groupLabel={step.condensingConfig.groupLabel}
              onComplete={() => onStepUpdate({ condenseDone: true })}
            />
          )}
          {!stepState.condenseDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.condenseDone && step.feedback?.correct && (
            <FeedbackBox variant="neutral" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'combined-experiment':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.combinedExperimentConfig && (
            <CombinedExperiment
              trials={step.combinedExperimentConfig.trials}
              dieFaces={step.combinedExperimentConfig.dieFaces}
              targetFace={step.combinedExperimentConfig.targetFace}
              coinLabels={step.combinedExperimentConfig.coinLabels}
              targetCoinIndex={step.combinedExperimentConfig.targetCoinIndex}
              onComplete={() => onStepUpdate({ combinedExpDone: true })}
            />
          )}
          {!stepState.combinedExpDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.combinedExpDone && step.feedback?.correct && (
            <FeedbackBox variant="neutral" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'dependence-pairing':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.dependencePairingConfig && (
            <DependencePairing
              cards={step.dependencePairingConfig.cards}
              dependentPairs={step.dependencePairingConfig.dependentPairs}
              onComplete={() => onStepUpdate({ pairingDone: true })}
            />
          )}
          {!stepState.pairingDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.pairingDone && step.feedback?.correct && (
            <FeedbackBox variant="correct" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'expected-value-sim':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          <ExpectedValueRoller
            sides={step.expectedValueSimConfig?.sides}
            onComplete={() => onStepUpdate({ evSimDone: true })}
          />
          {!stepState.evSimDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.evSimDone && step.feedback?.correct && (
            <FeedbackBox variant="neutral" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'multiset-condense':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          <MultisetCondense
            groups={step.multisetCondenseConfig?.groups}
            onComplete={() => onStepUpdate({ multisetCondenseDone: true })}
          />
          {!stepState.multisetCondenseDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.multisetCondenseDone && step.feedback?.correct && (
            <FeedbackBox variant="neutral" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'product-grid':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.productGridConfig && (
            <ProductGrid
              rowLabel={step.productGridConfig.rowLabel}
              colLabel={step.productGridConfig.colLabel}
              rows={step.productGridConfig.rows}
              cols={step.productGridConfig.cols}
              rowEmoji={step.productGridConfig.rowEmoji}
              colEmoji={step.productGridConfig.colEmoji}
              pairingLabel={step.productGridConfig.pairingLabel}
              onComplete={() => onStepUpdate({ productGridDone: true })}
            />
          )}
          {!stepState.productGridDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.productGridDone && step.feedback?.correct && (
            <FeedbackBox variant="correct" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'factorial-discovery':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.factorialConfig && (
            <FactorialDiscovery
              itemLabel={step.factorialConfig.itemLabel}
              count={step.factorialConfig.count}
              slots={step.factorialConfig.slots}
              onComplete={() => onStepUpdate({ factorialDone: true })}
            />
          )}
          {stepState.factorialDone && step.feedback?.correct && (
            <FeedbackBox variant="correct" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'worked-example':
      return (
        <div>
          {step.body && <p className="mb-4 text-slate-700">{step.body}</p>}
          {step.workedExampleConfig && (
            <WorkedExampleStep
              config={step.workedExampleConfig}
              onDone={() => onStepUpdate({ workedExampleDone: true })}
            />
          )}
        </div>
      )

    case 'conditional-select':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.conditionalSelectConfig && (
            <ConditionalSelect
              outcomes={step.conditionalSelectConfig.outcomes}
              givenIds={step.conditionalSelectConfig.givenIds}
              favorableIds={step.conditionalSelectConfig.favorableIds}
              givenLabel={step.conditionalSelectConfig.givenLabel}
              favorableLabel={step.conditionalSelectConfig.favorableLabel}
              onComplete={() => onStepUpdate({ conditionalSelectDone: true })}
            />
          )}
          {!stepState.conditionalSelectDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.conditionalSelectDone && step.feedback?.correct && (
            <FeedbackBox variant="correct" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'complement-select':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          {step.complementSelectConfig && (
            <ComplementSelect
              outcomes={step.complementSelectConfig.outcomes}
              complementIds={step.complementSelectConfig.complementIds}
              complementLabel={step.complementSelectConfig.complementLabel}
              eventLabel={step.complementSelectConfig.eventLabel}
              columns={step.complementSelectConfig.columns}
              onComplete={() => onStepUpdate({ complementSelectDone: true })}
            />
          )}
          {!stepState.complementSelectDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.complementSelectDone && step.feedback?.correct && (
            <FeedbackBox variant="correct" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'coin-flip-sim':
      return (
        <div>
          <p className="mb-4 text-slate-700">{step.body}</p>
          <CoinFlipSim
            coins={step.coinFlipSimConfig?.coins}
            showIndicators={step.coinFlipSimConfig?.showIndicators}
            onComplete={() => onStepUpdate({ coinSimDone: true })}
          />
          {!stepState.coinSimDone && (
            <HintButton hint={step.feedback?.hint} computationHint={step.feedback?.computationHint} />
          )}
          {stepState.coinSimDone && step.feedback?.correct && (
            <FeedbackBox variant="neutral" message={step.feedback.correct} />
          )}
        </div>
      )

    case 'multiple-choice':
      return step.question ? (
        <div>
          {step.body && <p className="mb-4 text-slate-700">{step.body}</p>}
          {step.orderingsDisplay && <OrderingsList items={step.orderingsDisplay} />}
          <MultipleChoiceStep
            prompt={step.prompt}
            question={step.question}
            feedback={step.feedback}
            hint={step.feedback?.hint}
            computationHint={step.feedback?.computationHint}
            allowChange
            everCorrect={stepState.everCorrect}
            onAnswer={(index, correct) =>
              onStepUpdate({ answered: true, correct, selectedIndex: index, answer: index })
            }
            showResult={stepState.answered}
            selectedIndex={stepState.selectedIndex}
            aiHelp={stepState.aiHelp}
            aiBusy={aiBusy}
            onRequestHint={onRequestHint}
            onRequestFeedback={onRequestFeedback}
            onRevisit={onRevisit}
            reviewStepTitle={reviewStepTitle}
          />
        </div>
      ) : null

    case 'numeric-question':
      return step.question ? (
        <div>
          {step.body && <p className="mb-4 text-slate-700">{step.body}</p>}
          <NumericQuestionStep
            prompt={step.prompt}
            question={step.question}
            feedback={step.feedback}
            hint={step.feedback?.hint}
            computationHint={step.feedback?.computationHint}
            onAnswer={(value, correct) => onStepUpdate({ answered: true, correct, answer: value })}
            showResult={stepState.answered}
            lastAnswer={typeof stepState.answer === 'number' ? stepState.answer : null}
            aiHelp={stepState.aiHelp}
            aiBusy={aiBusy}
            onRequestHint={onRequestHint}
            onRequestFeedback={onRequestFeedback}
            onRevisit={onRevisit}
            reviewStepTitle={reviewStepTitle}
          />
        </div>
      ) : null

    case 'fraction-question':
      return step.question ? (
        <div>
          {step.body && <p className="mb-4 text-slate-700">{step.body}</p>}
          <FractionQuestionStep
            prompt={step.prompt}
            question={step.question}
            feedback={step.feedback}
            hint={step.feedback?.hint}
            computationHint={step.feedback?.computationHint}
            onAnswer={(value, correct) => onStepUpdate({ answered: true, correct, answer: value })}
            showResult={stepState.answered}
            lastAnswer={typeof stepState.answer === 'string' ? stepState.answer : null}
            aiHelp={stepState.aiHelp}
            aiBusy={aiBusy}
            onRequestHint={onRequestHint}
            onRequestFeedback={onRequestFeedback}
            onRevisit={onRevisit}
            reviewStepTitle={reviewStepTitle}
          />
        </div>
      ) : null

    case 'completion':
      return (
        <div className="text-center">
          <div className="mb-4 text-4xl sm:text-5xl">🎉</div>
          <p className="text-base text-slate-700 sm:text-lg">{step.body}</p>
        </div>
      )

    default:
      return null
  }
}

/**
 * The completion-flag patch for a non-graded interactive step type — the typed
 * inverse of {@link canAdvance}'s per-type checks. Used to restore a completed
 * interactive step from `completedSteps` without guessing from the step id.
 */
// eslint-disable-next-line react/only-export-components
export function interactiveDoneState(type: StepType): Partial<StepState> {
  switch (type) {
    case 'arrangement':
      return { explorationDone: true }
    case 'connection':
      return { connectionDone: true }
    case 'tree':
      return { treeDone: true }
    case 'simulation':
      return { simulationDone: true }
    case 'probability':
      return { probabilityDone: true }
    case 'outcome-select':
      return { outcomeSelectDone: true }
    case 'condensing':
      return { condenseDone: true }
    case 'combined-experiment':
      return { combinedExpDone: true }
    case 'dependence-pairing':
      return { pairingDone: true }
    case 'expected-value-sim':
      return { evSimDone: true }
    case 'product-grid':
      return { productGridDone: true }
    case 'multiset-condense':
      return { multisetCondenseDone: true }
    case 'factorial-discovery':
      return { factorialDone: true }
    case 'worked-example':
      return { workedExampleDone: true }
    case 'conditional-select':
      return { conditionalSelectDone: true }
    case 'complement-select':
      return { complementSelectDone: true }
    case 'coin-flip-sim':
      return { coinSimDone: true }
    default:
      return {}
  }
}

// Pure helper colocated with the renderer it pairs with; not a component, so
// React Fast Refresh's only-export-components rule doesn't apply.
// eslint-disable-next-line react/only-export-components
export function canAdvance(step: LessonStep, stepState: StepState): boolean {
  switch (step.type) {
    case 'intro':
      return true
    case 'arrangement':
      return stepState.explorationDone === true
    case 'connection':
      return stepState.connectionDone === true
    case 'tree':
      return stepState.treeDone === true
    case 'simulation':
      return stepState.simulationDone === true
    case 'probability':
      return stepState.probabilityDone === true
    case 'outcome-select':
      return stepState.outcomeSelectDone === true
    case 'condensing':
      return stepState.condenseDone === true
    case 'combined-experiment':
      return stepState.combinedExpDone === true
    case 'dependence-pairing':
      return stepState.pairingDone === true
    case 'expected-value-sim':
      return stepState.evSimDone === true
    case 'product-grid':
      return stepState.productGridDone === true
    case 'multiset-condense':
      return stepState.multisetCondenseDone === true
    case 'factorial-discovery':
      return stepState.factorialDone === true
    case 'worked-example':
      return stepState.workedExampleDone === true
    case 'conditional-select':
      return stepState.conditionalSelectDone === true
    case 'complement-select':
      return stepState.complementSelectDone === true
    case 'coin-flip-sim':
      return stepState.coinSimDone === true
    case 'multiple-choice':
    case 'numeric-question':
    case 'fraction-question':
      return stepState.everCorrect === true
    case 'completion':
      return true
    default:
      return false
  }
}
