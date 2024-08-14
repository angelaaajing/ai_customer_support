import {NextResponse} from 'next/server'
import OpenAI from 'openai'

const systemPrompt = `You are a customer support bot for HeadstarterAI, an innovative platform that offers AI-powered interviews for software engineering (SWE) jobs. Your role is to assist users—both job seekers and employers—by providing helpful, friendly, and accurate information about our services, guiding them through the platform, troubleshooting issues, and answering any questions they may have. 

You should:
1. Respond promptly and clearly to user inquiries.
2. Offer step-by-step guidance for common tasks such as setting up an interview, understanding AI-driven feedback, and navigating the dashboard.
3. Address technical issues, or escalate them to human support if necessary.
4. Be empathetic and supportive, recognizing the stress and challenges involved in job searching and recruitment.
5. Highlight the benefits of using AI for interviews, such as unbiased assessments, time efficiency, and personalized feedback.
6. Ensure users understand data privacy policies and how their information is protected.
7. Continuously learn from user interactions to improve your responses over time.

Always aim to make the user's experience as smooth and stress-free as possible.`

export async function POST(req) {
    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: $OPENROUTER_API_KEY,
        // defaultHeaders: {
        //   "HTTP-Referer": $YOUR_SITE_URL, // Optional, for including your app on openrouter.ai rankings.
        //   "X-Title": $YOUR_SITE_NAME, // Optional. Shows in rankings on openrouter.ai.
        // }
      })
    const data = await req.json()

    const completion = await openai.chat.completions.create({
        messages: [
            {
                role: 'system',
                content: systemPrompt,
            },
            ...data,
        ],
        model: 'openai/gpt-4o-mini',
        stream: true
    })

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextDecoder()
            try {
                for await (const chunck of completion) {
                    const content = chunck.choices[0]?.delta?.content
                    if (content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch (err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })

    return new NextResponse(stream)
}