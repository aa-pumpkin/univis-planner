// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia } from "pinia";
import App from "./App.vue";
import realDataset from "../public/data/univis-2026s.json";
import winterDataset from "../public/data/univis-2025w.json";

const chooseSemesterAndMinor = async (
  wrapper: ReturnType<typeof mount>,
  semesterIndex: number,
  minorIndex = 0,
) => {
  await wrapper
    .findAll(".semester-grid button")
    [semesterIndex].trigger("click");
  await flushPromises();
  await wrapper.findAll(".wizard-list input")[minorIndex].setValue(true);
  await flushPromises();
};

describe("planner wizard", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
      clear: () => values.clear(),
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  });

  it("continues after selecting a study semester and minor", async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } });

    await wrapper.get(".primary-action").trigger("click");
    expect(wrapper.text()).toContain("In welchem Semester bist du?");

    await wrapper.findAll(".semester-grid button")[3].trigger("click");
    await flushPromises();
    expect(wrapper.text()).toContain("Welches Nebenfach belegst du?");

    await wrapper.findAll(".wizard-list input")[0].setValue(true);
    await flushPromises();

    expect(wrapper.text()).toContain("Diese Module gehören zum 4. Semester");
    expect(wrapper.text()).toContain("Betriebswirtschaftslehre");
    expect(wrapper.text()).toContain("ECTS");
  });

  it("shows the official first-semester curriculum before timetable data is published", async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } });

    await wrapper.get(".primary-action").trigger("click");
    await chooseSemesterAndMinor(wrapper, 0);

    expect(wrapper.text()).toContain("Einführung in die Informatik");
    expect(wrapper.text()).toContain("Computersysteme");
    expect(wrapper.text()).toContain("Mathematik für die Informatik A");
    expect(wrapper.text()).toContain(
      "Einführung in die Betriebswirtschaftslehre",
    );
    expect(wrapper.text()).not.toContain("Demo-Daten");
  });

  it("does not offer electives in the second semester", async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } });

    await wrapper.get(".primary-action").trigger("click");
    await chooseSemesterAndMinor(wrapper, 1);

    await wrapper.get(".wizard-content .primary-action").trigger("click");

    expect(wrapper.text()).toContain("noch keine Wahlpflichtmodule");
    expect(wrapper.text()).not.toContain("Internet of Things");
  });

  it("does not render a misleading partial timetable", async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } });

    await wrapper.get(".primary-action").trigger("click");
    await chooseSemesterAndMinor(wrapper, 1);

    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.findAll(".yes-no button")[0].trigger("click");
    await wrapper.get(".wizard-content .primary-action").trigger("click");

    expect(wrapper.text()).toContain("Der Plan wäre unvollständig");
    expect(wrapper.find(".calendar").exists()).toBe(false);
  });

  it("renders schedule candidates for the real second-semester data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => realDataset,
      }),
    );

    const wrapper = mount(App, { global: { plugins: [createPinia()] } });

    await flushPromises();
    await wrapper.get(".primary-action").trigger("click");
    await chooseSemesterAndMinor(wrapper, 1);

    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.findAll(".yes-no button")[0].trigger("click");
    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await flushPromises();

    expect(wrapper.text()).toContain("Ausgewogen");
    expect(wrapper.find(".calendar").exists()).toBe(true);
  });

  it("still builds a plan when lectures are loaded but exercise groups are missing", async () => {
    const lectureOnly = {
      ...realDataset,
      courses: realDataset.courses.filter(
        (course) => course.type !== "exercise",
      ),
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => lectureOnly,
      }),
    );

    const wrapper = mount(App, { global: { plugins: [createPinia()] } });

    await flushPromises();
    await wrapper.get(".primary-action").trigger("click");
    await chooseSemesterAndMinor(wrapper, 1);

    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.findAll(".yes-no button")[0].trigger("click");
    await wrapper.get(".wizard-content .primary-action").trigger("click");

    expect(wrapper.text()).toContain("Ausgewogen");
    expect(wrapper.text()).not.toContain("Stundenplan noch nicht verfügbar");
    expect(wrapper.find(".calendar").exists()).toBe(true);
  });

  it("keeps usable semester data when the other semester import fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation((url: string) =>
          url.includes("2026s")
            ? Promise.resolve({ ok: true, json: async () => realDataset })
            : Promise.reject(new Error("winter offline")),
        ),
    );

    const wrapper = mount(App, { global: { plugins: [createPinia()] } });

    await flushPromises();
    await wrapper.get(".primary-action").trigger("click");
    await chooseSemesterAndMinor(wrapper, 1);

    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.findAll(".yes-no button")[0].trigger("click");
    await wrapper.get(".wizard-content .primary-action").trigger("click");

    expect(wrapper.text()).toContain("Ausgewogen");
    expect(wrapper.text()).toContain("ECTS");
    expect(wrapper.find(".calendar").exists()).toBe(true);
  });

  it("renders schedule candidates for the real third-semester winter data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) =>
        Promise.resolve({
          ok: true,
          json: async () =>
            url.includes("current-terms")
              ? {
                  schemaVersion: 1,
                  generatedAt: "test",
                  terms: { odd: "2025w", even: "2026s" },
                }
              : url.includes("2025w")
                ? winterDataset
                : realDataset,
        }),
      ),
    );

    const wrapper = mount(App, { global: { plugins: [createPinia()] } });

    await flushPromises();
    await wrapper.get(".primary-action").trigger("click");
    await chooseSemesterAndMinor(wrapper, 2);

    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.findAll(".yes-no button")[0].trigger("click");
    await wrapper.get(".wizard-content .primary-action").trigger("click");

    expect(wrapper.text()).toContain("Ausgewogen");
    expect(wrapper.find(".calendar").exists()).toBe(true);
  });

  it("renders a real fifth-semester plan after choosing an offered option", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) =>
        Promise.resolve({
          ok: true,
          json: async () =>
            url.includes("current-terms")
              ? {
                  schemaVersion: 1,
                  generatedAt: "test",
                  terms: { odd: "2025w", even: "2026s" },
                }
              : url.includes("2025w")
                ? winterDataset
                : realDataset,
        }),
      ),
    );

    const wrapper = mount(App, { global: { plugins: [createPinia()] } });

    await flushPromises();
    await wrapper.get(".primary-action").trigger("click");
    await chooseSemesterAndMinor(wrapper, 4);

    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.find(".wizard-list input").setValue(true);
    await wrapper.get(".wizard-content .primary-action").trigger("click");
    await wrapper.findAll(".yes-no button")[0].trigger("click");
    await wrapper.get(".wizard-content .primary-action").trigger("click");

    expect(wrapper.text()).not.toContain("Stundenplan noch nicht verfügbar");
    expect(wrapper.find(".calendar").exists()).toBe(true);
  });
});
