
@group(0) @binding(0) var texture: texture_2d<f32>;
@group(0) @binding(1) var texture_sampler: sampler;

struct VSIn {
	@location(0) pos: vec2f,
};

struct VSOut {
	@builtin(position) pos: vec4f,
	@location(0) uv: vec2f,
};

@vertex
fn vert_main(in: VSIn) -> VSOut {
	var out: VSOut;
	out.pos = vec4f(in.pos.xy, 0.0, 1.0);
	out.uv = in.pos.xy * 0.5 + 0.5;
	out.uv.y *= -1;
	return out;
}

@fragment
fn frag_main(in: VSOut) -> @location(0) vec4f
{
	var color = textureSample(texture, texture_sampler, in.uv).rgb;
	return vec4f(color, 1.0);
}
