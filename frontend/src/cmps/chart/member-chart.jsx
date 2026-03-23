import React, { useRef, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';
import { utilService } from '../../services/util.service';
import { BiDotsHorizontalRounded } from "react-icons/bi"
import { setDynamicModalObj } from '../../store/board.actions';
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function MemberChart({ board, dynamicModalObj }) {
    const elModalBtn = useRef()
    const [chartType, setChartType] = useState('doughnut')
    const data = {
        labels: getMembersName(),
        datasets: [
            {
                label: 'board members',
                data: getData(),
                backgroundColor: getRandomColors(),
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 10,
            },
        ],
    }

    const options = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif",
                    },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                borderRadius: 8,
                titleFont: {
                    size: 14,
                },
                bodyFont: {
                    size: 13,
                },
            },
        },
        cutout: '70%',
        maintainAspectRatio: false,
        responsive: true,
    }

    function getMembersName() {
        return board.members.map(member => member.fullname)
    }

    function getRandomColors() {
        const colorArr = utilService.getColors()
        return board.members.map((_, idx) => colorArr[idx % colorArr.length])
    }

    function getData() {
        const membersId = board.members.map(member => member._id)
        const data = new Array(membersId.length).fill(0)
        board.groups.forEach(group => group.tasks.forEach(task => task.memberIds.forEach(memberId => {
            data[membersId.indexOf(memberId)]++
        })))

        return data
    }

    function onToggleTypeModal() {
        const isOpen = dynamicModalObj.chartType === 'member' && dynamicModalObj?.type === 'chart-type' ? !dynamicModalObj.isOpen : true
        const { x, y } = elModalBtn.current.getClientRects()[0]
        setDynamicModalObj({ isOpen, pos: { x: (x - 110), y: (y + 20) }, type: 'chart-type', chartType: 'member', setChartType })
    }

    function getChart(chartType) {
        switch (chartType) {
            case 'pie':
                return <Pie data={data} options={options} />
            case 'bar':
                return <Bar data={data} options={{ ...options, scales: { y: { beginAtZero: true } } }} />
            case 'doughnut':
                return <Doughnut data={data} options={options} />
            default: return
        }
    }

    return (
        <section className='member-chart'>
            <div className='chart-header'>
                <div className='header-content'>
                    <h2>Tasks per member</h2>
                    <span className='icon-container' ref={elModalBtn} onClick={onToggleTypeModal}>
                        <BiDotsHorizontalRounded />
                    </span>
                </div>
            </div>
            <div className='chart-content' style={{ height: '300px', width: '100%' }}>
                {getChart(chartType)}
            </div>
        </section>
    )
}