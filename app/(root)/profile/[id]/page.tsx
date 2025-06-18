import React from 'react'
import Header from "@/components/Header";
import {dummyCards} from "@/constants";
import VideoCard from "@/components/VideoCard";

const Page = async ({params}: ParamsWithSearch) => {
        const {id} = await params;
    return (
        <main className={"wrapper page"}>
            <Header subHeader={"pavan@gmail.com"} title={"Pavan Kumar Mistry"} userImg={"/assets/images/dummy.jpg"} />

            <section className="video-grid">
                {dummyCards.map((card) => {
                    return <VideoCard key={card.id} {...card} />
                })}
            </section>
        </main>
    )
}
export default Page