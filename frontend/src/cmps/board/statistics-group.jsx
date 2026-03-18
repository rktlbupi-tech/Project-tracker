export function StatisticGroup({ cmpType, group, board }) {
    function getStatisticsStatus(cmp) {
        const labels = group.tasks.map(task => {
            return board.labels.find(label => label.title === task[cmp])
        })
        const mapLabel = labels.reduce((acc, label) => {
            if (acc[label.color]) acc[label.color]++
            else acc[label.color] = 1
            return acc
        }, {})
        const result = []
        for (let key in mapLabel) {
            result.push({ background: key, width: `${mapLabel[key] / labels.length * 100}%` })
        }
        return result
    }

    function getStatisticsNumber() {
        const sumOfNumbers = group.tasks.reduce((acc, task) => {
            if (task.number) return acc + task.number
            return acc
        }, 0)
        return sumOfNumbers
    }

    function getStatisticsResult() {
        switch (cmpType) {
            case 'member-picker':
                return
            /*
            case 'status-picker':
                return (
                    <div className="statistic-group-container flex column">
                        <span className="statistic-label">Status Summary</span>
                        <div className="statistic-bar flex">
                            <GetStatisticsLabel statisticLabels={getStatisticsStatus('status')} />
                        </div>
                    </div>
                )
            case 'priority-picker':
                return (
                    <div className="statistic-group-container flex column">
                        <span className="statistic-label">Priority Summary</span>
                        <div className="statistic-bar flex">
                            <GetStatisticsLabel statisticLabels={getStatisticsStatus('priority')} />
                        </div>
                    </div>
                )
            */
            case 'date-picker':
                return []
            case 'number-picker':
                return <GetStatisticsNumber statisticNumber={getStatisticsNumber()} />
            default: return []
        }
    }
    return (
        <>
            {getStatisticsResult()}
        </>
    )
}

function GetStatisticsLabel({ statisticLabels }) {
    return (
        statisticLabels.map((label, idx) => {
            return <span data-testid={`label-${idx}`} key={idx} style={label} ></span>
        })
    )
}

function GetStatisticsNumber({ statisticNumber }) {
    return (
        <div role="contentinfo" className="statistic-number flex column align-center">
            <span className="number">{statisticNumber}</span>
            <span className="sum">sum</span>
        </div>
    )
}